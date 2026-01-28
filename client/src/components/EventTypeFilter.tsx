"use client";

import { Copy, Eye, ExternalLink, FileInput, MousePointerClick, TextCursorInput, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_CONFIG, EventType } from "@/lib/events";

// Icon mapping for event types
const EVENT_TYPE_ICONS: Record<EventType, React.ReactNode> = {
  pageview: <Eye className="h-3 w-3" />,
  custom_event: <MousePointerClick className="h-3 w-3" />,
  outbound: <ExternalLink className="h-3 w-3" />,
  error: <TriangleAlert className="h-3 w-3" />,
  button_click: <MousePointerClick className="h-3 w-3" />,
  copy: <Copy className="h-3 w-3" />,
  form_submit: <FileInput className="h-3 w-3" />,
  input_change: <TextCursorInput className="h-3 w-3" />,
};

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
    form_submit?: number;
    input_change?: number;
  };
}

export function EventTypeFilter({ visibleTypes, onToggle, counts }: EventTypeFilterProps) {
  return (
    <div className="flex items-center space-x-2">
      {EVENT_TYPE_CONFIG.map((option) => {
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
                option.colorClass,
                isSelected ? "opacity-100" : "opacity-30"
              )}
            >
              {EVENT_TYPE_ICONS[option.value]}
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
