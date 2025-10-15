"use client";

import { useGetSessionLocations } from "@/api/analytics/useGetSessionLocations";
import { scaleSqrt } from "d3-scale";
import "ol/ol.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import { Point } from "ol/geom";
import Feature from "ol/Feature";
import { useCountries } from "../../../../lib/geo";
import type { FeatureLike } from "ol/Feature";

interface TooltipContent {
  count: number;
  city: string;
}

interface TooltipPosition {
  x: number;
  y: number;
}

export function RealtimeMap() {
  const { data: liveSessionLocations, isLoading: isLiveSessionLocationsLoading } = useGetSessionLocations();
  const { data: countriesGeoData } = useCountries();
  const [currentZoom, setCurrentZoom] = useState(1.5); // Initial zoom level
  const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const countryLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const circleLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  // Create a scale for circle radius based on count
  const radiusScale = useMemo(() => {
    if (!liveSessionLocations?.length) return () => 0;

    const maxCount = Math.max(...liveSessionLocations.map(loc => loc.count));

    // Use sqrt scale to make small values more visible
    // This directly scales radius (not area) which makes small circles more noticeable
    const baseScale = scaleSqrt().domain([1, maxCount]).range([5, 50]); // Min/max radius in pixels

    return (count: number) => {
      const baseRadius = baseScale(count);
      // Reduce radius gradually as zoom increases
      const zoomFactor = Math.pow(0.75, currentZoom - 1.5);
      return baseRadius * zoomFactor;
    };
  }, [liveSessionLocations, currentZoom]);

  const getCountryStyle = (feature: FeatureLike) => {
    return new Style({
      fill: new Fill({
        color: "rgba(140, 140, 140, 0.2)",
      }),
      stroke: new Stroke({
        color: "rgba(140, 140, 140, 0.5)",
        width: 0.5,
      }),
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: fromLonLat([0, 30]),
        zoom: 1.5,
        minZoom: 1,
      }),
      controls: [],
    });

    mapInstanceRef.current = map;

    // Handle zoom changes
    map.getView().on("change:resolution", () => {
      const zoom = map.getView().getZoom() || 1.5;
      setCurrentZoom(zoom);
    });

    // Handle pointer move for hover effects
    map.on("pointermove", (evt) => {
      if (evt.dragging) {
        return;
      }

      const pixel = map.getEventPixel(evt.originalEvent);
      const feature = map.forEachFeatureAtPixel(
        pixel,
        (feature) => feature,
        {
          layerFilter: (layer) => layer === circleLayerRef.current,
        }
      );

      if (feature) {
        const count = feature.get("count");
        const city = feature.get("city");

        setTooltipContent({
          count,
          city,
        });

        // Update tooltip position
        const [x, y] = evt.pixel;
        const rect = mapRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPosition({
            x: rect.left + x,
            y: rect.top + y,
          });
        }
      } else {
        setTooltipContent(null);
      }
    });

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  // Update country layer when geo data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!countriesGeoData) return;

    // Remove existing layer
    if (countryLayerRef.current) {
      mapInstanceRef.current.removeLayer(countryLayerRef.current);
    }

    // Create new vector source with GeoJSON data
    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(countriesGeoData, {
        featureProjection: "EPSG:3857",
      }),
    });

    // Create new vector layer
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: getCountryStyle,
    });

    countryLayerRef.current = vectorLayer;
    mapInstanceRef.current.addLayer(vectorLayer);
  }, [countriesGeoData]);

  // Update circle layer when session locations change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!liveSessionLocations?.length) return;

    // Remove existing circle layer
    if (circleLayerRef.current) {
      mapInstanceRef.current.removeLayer(circleLayerRef.current);
    }

    // Get computed color from CSS variables
    const getComputedColor = (cssVar: string) => {
      const hslValues = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
      return `hsl(${hslValues})`;
    };

    // Create features for each location
    const features = liveSessionLocations.map((location) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([location.lon, location.lat])),
        count: location.count,
        city: location.city,
      });

      const radius = radiusScale(location.count);

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: radius,
            fill: new Fill({
              color: getComputedColor("--accent-500").replace("hsl(", "hsla(").replace(")", ", 0.4)"),
            }),
            stroke: new Stroke({
              color: getComputedColor("--accent-400"),
              width: 0,
            }),
          }),
        })
      );

      return feature;
    });

    // Create new circle layer
    const circleSource = new VectorSource({
      features: features,
    });

    const circleLayer = new VectorLayer({
      source: circleSource,
    });

    circleLayerRef.current = circleLayer;
    mapInstanceRef.current.addLayer(circleLayer);
  }, [liveSessionLocations, radiusScale]);

  return (
    <div>
      <div
        className="w-full h-[600px] rounded-lg overflow-hidden border border-neutral-850"
        onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
          if (tooltipContent) {
            setTooltipPosition({
              x: e.clientX,
              y: e.clientY,
            });
          }
        }}
      >
        <div
          ref={mapRef}
          style={{
            height: "100%",
            width: "100%",
            background: "none",
          }}
        />

        {tooltipContent && (
          <div
            className="fixed bg-neutral-1000 text-white rounded-md p-2 shadow-lg text-sm pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 10,
              transform: "translate(-50%, -100%)",
              zIndex: 500,
            }}
          >
            <div className="font-sm">
              <span className="font-bold text-accent-400">{tooltipContent.count.toLocaleString()}</span>{" "}
              <span className="text-neutral-300">
                active {tooltipContent.count === 1 ? "user" : "users"}
                {tooltipContent.city ? ` from ${tooltipContent.city}` : ""}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
