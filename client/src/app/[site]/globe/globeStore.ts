import { create } from "zustand";
import { MapView } from "./components/ModeSelector";

interface GlobeStore {
  mapView: MapView;
  setMapView: (view: MapView) => void;
  mapMode: "3D" | "2D";
  setMapMode: (mode: "3D" | "2D") => void;
}

export const useGlobeStore = create<GlobeStore>(set => ({
  mapView: "timeline",
  setMapView: view => set({ mapView: view }),
  mapMode: "3D",
  setMapMode: mode => set({ mapMode: mode }),
}));
