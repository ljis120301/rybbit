"use client";

import { Copy, Eye, ExternalLink, MousePointerClick, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type EventType = "pageview" | "custom_event" | "error" | "outbound" | "button_click" | "copy";

interface EventTypeOption {
  value: EventType;
  label: string;
  color: string;
  icon: React.ReactNode;
}

const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  {
    value: "pageview",
    label: "Pageviews",
    color: "rgb(96, 165, 250)", // blue-400
    icon: <Eye className="h-3 w-3" />,
  },
  {
    value: "custom_event",
    label: "Events",
    color: "rgb(251, 191, 36)", // amber-400
    icon: <MousePointerClick className="h-3 w-3" />,
  },
  {
    value: "outbound",
    label: "Outbound",
    color: "rgb(168, 85, 247)", // purple-500
    icon: <ExternalLink className="h-3 w-3" />,
  },
  {
    value: "error",
    label: "Errors",
    color: "rgb(239, 68, 68)", // red-500
    icon: <TriangleAlert className="h-3 w-3" />,
  },
  {
    value: "button_click",
    label: "Button Clicks",
    color: "rgb(34, 197, 94)", // green-500
    icon: <MousePointerClick className="h-3 w-3" />,
  },
  {
    value: "copy",
    label: "Copies",
    color: "rgb(14, 165, 233)", // sky-500
    icon: <Copy className="h-3 w-3" />,
  },
];

interface EventTypeFilterProps {
  visibleTypes: Set<string>;
  onToggle: (type: string) => void;
  counts?: {
    pageview?: number;
    custom_event?: number;
    error?: number;
    outbound?: number;
    button_click?: number;
    copy?: number;
  };
}

export function EventTypeFilter({ visibleTypes, onToggle, counts }: EventTypeFilterProps) {
  return (
    <div className="flex items-center space-x-2">
      {EVENT_TYPE_OPTIONS.map((option) => {
        const isSelected = visibleTypes.has(option.value);
        const count = counts?.[option.value];

        return (
          <button
            key={option.value}
            onClick={() => onToggle(option.value)}
            className={cn(
              "flex items-center space-x-1.5 px-2 py-1 rounded text-xs font-medium transition-all",
              isSelected
                ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                : "bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400"
            )}
          >
            <div
              className={cn(
                "w-3 h-3 rounded-sm flex items-center justify-center transition-opacity",
                isSelected ? "opacity-100" : "opacity-30"
              )}
              style={{ color: option.color }}
            >
              {option.icon}
            </div>
            <span>{option.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] leading-none",
                  isSelected
                    ? "bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-500"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
