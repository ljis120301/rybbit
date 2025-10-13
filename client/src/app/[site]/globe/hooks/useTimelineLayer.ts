import BoringAvatar from "boring-avatars";
import { round } from "lodash";
import mapboxgl from "mapbox-gl";
import { createElement, useEffect, useRef } from "react";
// @ts-ignore - React 19 has built-in types
import { renderToStaticMarkup } from "react-dom/server";
import { useTimelineSessions } from "./useTimelineSessions";

// Generate avatar SVG using boring-avatars
function generateAvatarSVG(userId: string, size: number): string {
  const avatarElement = createElement(BoringAvatar, {
    size,
    name: userId,
    variant: "beam",
    colors: ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"],
  });
  return renderToStaticMarkup(avatarElement);
}

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
  const markersMapRef = useRef<Map<string, { marker: mapboxgl.Marker; element: HTMLDivElement }>>(new Map());

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

    const markersMap = markersMapRef.current;

    // Hide all markers if not in timeline view
    if (mapView !== "timeline") {
      markersMap.forEach(({ marker }) => marker.remove());
      return;
    }

    // Build set of active session IDs
    const activeSessionIds = new Set(
      activeSessions.filter(s => s.lat && s.lon).map(s => s.session_id)
    );

    // Remove markers for sessions that are no longer active
    const toRemove: string[] = [];
    markersMap.forEach(({ marker }, sessionId) => {
      if (!activeSessionIds.has(sessionId)) {
        marker.remove();
        toRemove.push(sessionId);
      }
    });
    toRemove.forEach(id => markersMap.delete(id));

    // Create or update markers for active sessions
    activeSessions
      .filter(session => session.lat && session.lon)
      .forEach(session => {
        if (!map.current) return;

        const roundedLat = round(session.lat, 4);
        const roundedLon = round(session.lon, 4);
        const existing = markersMap.get(session.session_id);

        if (existing) {
          // Update existing marker position if needed
          const currentLngLat = existing.marker.getLngLat();
          if (currentLngLat.lng !== roundedLon || currentLngLat.lat !== roundedLat) {
            existing.marker.setLngLat([roundedLon, roundedLat]);
          }
          // Re-add marker if it was removed
          if (!existing.marker.getElement().isConnected) {
            existing.marker.addTo(map.current);
          }
        } else {
          // Create new marker
          const avatarContainer = document.createElement("div");
          avatarContainer.className = "timeline-avatar-marker";
          avatarContainer.style.cursor = "pointer";
          avatarContainer.style.borderRadius = "50%";
          avatarContainer.style.overflow = "hidden";
          avatarContainer.style.width = "32px";
          avatarContainer.style.height = "32px";
          avatarContainer.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

          // Generate avatar SVG
          const avatarSVG = generateAvatarSVG(session.user_id, 32);
          avatarContainer.innerHTML = avatarSVG;

          // Create marker
          const marker = new mapboxgl.Marker({
            element: avatarContainer,
            anchor: "center",
          })
            .setLngLat([roundedLon, roundedLat])
            .addTo(map.current);

          // Add hover events for tooltip
          const showTooltip = () => {
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
          };

          const hideTooltip = () => {
            if (popupRef.current) {
              popupRef.current.remove();
            }
          };

          avatarContainer.addEventListener("mouseenter", showTooltip);
          avatarContainer.addEventListener("mouseleave", hideTooltip);

          // Store marker
          markersMap.set(session.session_id, { marker, element: avatarContainer });
        }
      });

    // Cleanup function
    return () => {
      if (mapView !== "timeline") {
        markersMap.forEach(({ marker }) => marker.remove());
      }
    };
  }, [activeSessions, mapLoaded, map, mapView]);
}
