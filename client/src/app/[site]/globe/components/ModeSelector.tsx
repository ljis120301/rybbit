import { Clock, Globe2, HouseIcon, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobeStore } from "../globeStore";

export type MapView = "countries" | "subdivisions" | "coordinates" | "timeline";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded px-2 py-1 text-xs font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400",
        active ? "bg-white/10 text-white" : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export default function MapViewSelector() {
  const { mapView, setMapView, mapMode, setMapMode } = useGlobeStore();

  return (
    <div>
      <div className="inline-flex items-center gap-0.5 rounded-lg bg-neutral-900/40 backdrop-blur-sm p-0.5 border border-white/10">
        <TabButton
          active={mapView === "timeline"}
          onClick={() => setMapView("timeline")}
          icon={<Clock className="mr-1 opacity-60" size={14} />}
          label="Timeline"
        />
        <TabButton
          active={mapView === "coordinates"}
          onClick={() => setMapView("coordinates")}
          icon={<Radio className="mr-1 opacity-60" size={14} />}
          label="Coordinates"
        />
        <TabButton
          active={mapView === "countries"}
          onClick={() => setMapView("countries")}
          icon={<Globe2 className="mr-1 opacity-60" size={14} />}
          label="Countries"
        />
        <TabButton
          active={mapView === "subdivisions"}
          onClick={() => setMapView("subdivisions")}
          icon={<HouseIcon className="mr-1 opacity-60" size={14} />}
          label="Subdivisions"
        />
      </div>

      <div className="inline-flex items-center gap-0.5 rounded-lg bg-neutral-900/40 backdrop-blur-sm p-0.5 border border-white/10">
        <TabButton
          active={mapMode === "3D"}
          onClick={() => setMapMode("3D")}
          icon={<Globe2 className="mr-1 opacity-60" size={14} />}
          label="3D"
        />
        <TabButton
          active={mapMode === "2D"}
          onClick={() => setMapMode("2D")}
          icon={<Globe2 className="mr-1 opacity-60" size={14} />}
          label="2D"
        />
      </div>
    </div>
  );
}
