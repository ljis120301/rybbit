import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { useTimelineSessions } from "../useTimelineSessions";
import type { GetSessionsResponse } from "../../../../../api/analytics/userSessions";
import { useTimelineStore } from "../../timelineStore";
import { initializeClusterSource, setupClusterClickHandler } from "./timelineClusterUtils";
import {
  SOURCE_ID,
  CLUSTER_LAYER_ID,
  CLUSTER_COUNT_LAYER_ID,
  UNCLUSTERED_LAYER_ID,
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  MIN_CLUSTER_SIZE,
  CLUSTERING_THRESHOLD,
} from "./timelineLayerConstants";
import { setClusterLayersVisibility, updateGeoJSONData } from "./timelineLayerManager";
import { updateMarkers as updateMarkersUtil, clearAllMarkers, type MarkerData } from "./timelineMarkerManager";

export function useTimelineLayer({
  map,
  mapLoaded,
  mapView,
}: {
  map: React.RefObject<mapboxgl.Map | null>;
  mapLoaded: boolean;
  mapView: string;
}) {
  const { activeSessions } = useTimelineSessions();
  const { currentTime } = useTimelineStore();
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markersMapRef = useRef<Map<string, MarkerData>>(new Map());
  const openTooltipSessionIdRef = useRef<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<GetSessionsResponse[number] | null>(null);

  // Close tooltip when timeline time changes
  useEffect(() => {
    if (popupRef.current && popupRef.current.isOpen()) {
      popupRef.current.remove();
      openTooltipSessionIdRef.current = null;
    }
  }, [currentTime]);

  // Initialize Mapbox source and layers for clustering
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;

    // Initialize popup once
    if (!popupRef.current) {
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "globe-tooltip",
        anchor: "top-left",
        offset: [-30, -30],
      });
    }

    // Add source if it doesn't exist
    if (!mapInstance.getSource(SOURCE_ID)) {
      initializeClusterSource(mapInstance, CLUSTER_MAX_ZOOM, CLUSTER_RADIUS);

      // Add cluster circle layer
      mapInstance.addLayer({
        id: CLUSTER_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["all", ["has", "point_count"], [">=", ["get", "point_count"], MIN_CLUSTER_SIZE]],
        paint: {
          "circle-color": ["step", ["get", "point_count"], "#3b82f6", 10, "#2563eb", 30, "#1d4ed8"],
          "circle-radius": ["step", ["get", "point_count"], 20, 10, 25, 30, 30],
        },
      });

      // Add cluster count layer
      mapInstance.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["all", ["has", "point_count"], [">=", ["get", "point_count"], MIN_CLUSTER_SIZE]],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Add unclustered point layer (hidden, used for querying)
      mapInstance.addLayer({
        id: UNCLUSTERED_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 0,
          "circle-opacity": 0,
        },
      });

      // Disable transitions on cluster layers
      mapInstance.setPaintProperty(CLUSTER_LAYER_ID, "circle-opacity-transition", { duration: 0 });
      mapInstance.setPaintProperty(CLUSTER_LAYER_ID, "circle-radius-transition", { duration: 0 });
      mapInstance.setPaintProperty(CLUSTER_LAYER_ID, "circle-color-transition", { duration: 0 });
      mapInstance.setPaintProperty(CLUSTER_COUNT_LAYER_ID, "text-opacity-transition", { duration: 0 });
    }

    // Setup cluster click handler
    const cleanupClusterClick = setupClusterClickHandler(mapInstance, CLUSTER_LAYER_ID);

    // Change cursor on cluster hover
    const handleClusterMouseEnter = () => {
      mapInstance.getCanvas().style.cursor = "pointer";
    };

    const handleClusterMouseLeave = () => {
      mapInstance.getCanvas().style.cursor = "";
    };

    mapInstance.on("mouseenter", CLUSTER_LAYER_ID, handleClusterMouseEnter);
    mapInstance.on("mouseleave", CLUSTER_LAYER_ID, handleClusterMouseLeave);

    return () => {
      cleanupClusterClick();
      mapInstance.off("mouseenter", CLUSTER_LAYER_ID, handleClusterMouseEnter);
      mapInstance.off("mouseleave", CLUSTER_LAYER_ID, handleClusterMouseLeave);
    };
  }, [map, mapLoaded]);

  // Update GeoJSON data and HTML markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const mapInstance = map.current;
    const markersMap = markersMapRef.current;

    // Hide layers and markers if not in timeline view
    if (mapView !== "timeline") {
      setClusterLayersVisibility(mapInstance, false);
      clearAllMarkers(markersMap);
      return;
    }

    // Show/hide cluster layers based on number of sessions
    const shouldShowClusters = activeSessions.length > CLUSTERING_THRESHOLD;
    setClusterLayersVisibility(mapInstance, shouldShowClusters);

    // Update GeoJSON data source
    updateGeoJSONData(mapInstance, activeSessions);

    // Function to update HTML markers for unclustered points
    const updateMarkers = async () => {
      await updateMarkersUtil(
        mapInstance,
        markersMap,
        shouldShowClusters,
        activeSessions,
        popupRef,
        openTooltipSessionIdRef,
        map,
        setSelectedSession
      );
    };

    // Initial update
    updateMarkers();

    // Update markers on zoom and move
    mapInstance.on("zoom", updateMarkers);
    mapInstance.on("move", updateMarkers);
    mapInstance.on("sourcedata", updateMarkers);

    // Handle map click to close tooltip
    const handleMapClick = () => {
      if (popupRef.current && popupRef.current.isOpen()) {
        popupRef.current.remove();
        openTooltipSessionIdRef.current = null;
      }
    };

    mapInstance.on("click", handleMapClick);

    // Cleanup function
    return () => {
      clearAllMarkers(markersMap);
      mapInstance.off("zoom", updateMarkers);
      mapInstance.off("move", updateMarkers);
      mapInstance.off("sourcedata", updateMarkers);
      mapInstance.off("click", handleMapClick);
    };
  }, [activeSessions, mapLoaded, map, mapView]);

  return {
    selectedSession,
    setSelectedSession,
  };
}
