import {
  Copy,
  ExternalLink,
  Eye,
  FileInput,
  MousePointerClick,
  TextCursorInput,
  TriangleAlert,
} from "lucide-react";
import { cn } from "../lib/utils";
import { EventType } from "../lib/events";

interface EventTypeIconProps {
  type: EventType | string;
  className?: string;
}

export function EventTypeIcon({ type, className }: EventTypeIconProps) {
  const baseClass = cn("h-4 w-4", className);

  switch (type) {
    case "pageview":
      return <Eye className={cn(baseClass, "text-blue-400")} />;
    case "custom_event":
      return <MousePointerClick className={cn(baseClass, "text-amber-400")} />;
    case "error":
      return <TriangleAlert className={cn(baseClass, "text-red-500")} />;
    case "outbound":
      return <ExternalLink className={cn(baseClass, "text-purple-500")} />;
    case "button_click":
      return <MousePointerClick className={cn(baseClass, "text-green-500")} />;
    case "copy":
      return <Copy className={cn(baseClass, "text-sky-500")} />;
    case "form_submit":
      return <FileInput className={cn(baseClass, "text-purple-500")} />;
    case "input_change":
      return <TextCursorInput className={cn(baseClass, "text-amber-500")} />;
    default:
      return <MousePointerClick className={cn(baseClass, "text-amber-400")} />;
  }
}

// Backwards-compatible aliases
export function PageviewIcon({ className }: { className?: string }) {
  return <EventTypeIcon type="pageview" className={className} />;
}

export function EventIcon({ className }: { className?: string }) {
  return <EventTypeIcon type="custom_event" className={className} />;
}
