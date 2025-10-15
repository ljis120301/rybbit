"use client";

import { useRef, useEffect } from "react";
import Map from "ol/Map";
import View from "ol/View";
import { fromLonLat } from "ol/proj";
import "ol/ol.css";
import { useOpenLayersCountriesLayer } from "../hooks/openLayers/useOpenLayersCountriesLayer";
import { useOpenLayersSubdivisionsLayer } from "../hooks/openLayers/useOpenLayersSubdivisionsLayer";

interface OpenLayersMapProps {
  mapView: "countries" | "subdivisions" | "coordinates" | "timeline";
}

export function OpenLayersMap({ mapView }: OpenLayersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const mapViewRef = useRef<typeof mapView>(mapView);

  // Update mapView ref when it changes
  useEffect(() => {
    mapViewRef.current = mapView;
  }, [mapView]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = new Map({
      target: mapRef.current,
      view: new View({
        center: fromLonLat([0, 20]),
        zoom: 2,
        minZoom: 1,
        maxZoom: 10,
      }),
      controls: [],
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

  // Use layer hooks
  useOpenLayersCountriesLayer({
    mapInstanceRef,
    mapViewRef,
    mapView,
  });

  useOpenLayersSubdivisionsLayer({
    mapInstanceRef,
    mapViewRef,
    mapView,
  });

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{
        background: "transparent",
      }}
    />
  );
}
