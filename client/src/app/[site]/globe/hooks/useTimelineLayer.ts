import BoringAvatar from "boring-avatars";
import { round } from "lodash";
import mapboxgl from "mapbox-gl";
import { createElement, useEffect, useRef } from "react";
// @ts-ignore - React 19 has built-in types
import { createRoot } from "react-dom/client";
import { useTimelineSessions } from "./useTimelineSessions";

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
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Initialize popup once
    if (!popupRef.current) {
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "globe-tooltip",
      });
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Only create markers if timeline view is active
    if (mapView !== "timeline") return;

    // Create markers for each active session
    activeSessions
      .filter(session => session.lat && session.lon) // Ensure lat/lon exist
      .forEach(session => {
        if (!map.current) return;

        const roundedLat = round(session.lat, 4);
        const roundedLon = round(session.lon, 4);

        // Create avatar HTML element
        const avatarContainer = document.createElement("div");
        avatarContainer.className = "timeline-avatar-marker";
        avatarContainer.style.cursor = "pointer";
        avatarContainer.style.borderRadius = "50%";
        avatarContainer.style.overflow = "hidden";
        avatarContainer.style.width = "32px";
        avatarContainer.style.height = "32px";
        avatarContainer.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

        // Render Avatar component using React
        const avatarElement = createElement(BoringAvatar, {
          size: 32,
          name: session.user_id,
          variant: "beam",
          colors: ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"],
        });
        const root = createRoot(avatarContainer);
        root.render(avatarElement);

        // Create marker
        const marker = new mapboxgl.Marker({
          element: avatarContainer,
          anchor: "center",
        })
          .setLngLat([roundedLon, roundedLat])
          .addTo(map.current);

        // Add hover events for tooltip
        avatarContainer.addEventListener("mouseenter", () => {
          if (!map.current || !popupRef.current) return;

          const html = `
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1">
                <span class="text-sm font-medium">${session.city || "Unknown"}, ${session.country || "Unknown"}</span>
              </div>
              <div class="text-xs text-neutral-300">
                <div>${session.browser || "Unknown"} · ${session.device_type || "Unknown"}</div>
                <div><span class="font-bold text-accent-400">${session.pageviews || 0}</span> pageviews</div>
              </div>
            </div>
          `;

          popupRef.current.setLngLat([roundedLon, roundedLat]).setHTML(html).addTo(map.current);
        });

        avatarContainer.addEventListener("mouseleave", () => {
          if (popupRef.current) {
            popupRef.current.remove();
          }
        });

        markersRef.current.push(marker);
      });

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [activeSessions, mapLoaded, map, mapView]);
}
