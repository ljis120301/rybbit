// ============================================================================
// Event Types and Configuration
// ============================================================================

export type EventType =
  | "pageview"
  | "custom_event"
  | "error"
  | "outbound"
  | "button_click"
  | "copy"
  | "form_submit"
  | "input_change";

export interface EventTypeConfig {
  value: EventType;
  label: string;
  colorClass: string;
}

export const EVENT_TYPE_CONFIG: EventTypeConfig[] = [
  { value: "pageview", label: "Pageviews", colorClass: "text-blue-400" },
  { value: "custom_event", label: "Events", colorClass: "text-amber-400" },
  { value: "outbound", label: "Outbound", colorClass: "text-purple-500" },
  { value: "error", label: "Errors", colorClass: "text-red-500" },
  { value: "button_click", label: "Button Clicks", colorClass: "text-green-500" },
  { value: "copy", label: "Copies", colorClass: "text-sky-500" },
  { value: "form_submit", label: "Form Submits", colorClass: "text-purple-500" },
  { value: "input_change", label: "Input Changes", colorClass: "text-amber-500" },
];

// ============================================================================
// Event Display Utilities
// ============================================================================

// Generic interface for event display - works with both SessionEvent and Event types
export interface EventLike {
  type: string;
  event_name?: string;
  props?: Record<string, any>;
}

// Helper to generate display name for auto-captured events
export function getEventDisplayName(item: EventLike): string {
  if (item.event_name) return item.event_name;

  switch (item.type) {
    case "outbound":
      return "Outbound Click";
    case "button_click":
      if (item.props?.text) return `Clicked button with text "${item.props.text}"`;
      if (item.props?.selector) return `Clicked button "${item.props.selector}"`;
      return "Clicked button";
    case "copy": {
      if (!item.props?.text) return "Copied text";
      const text = String(item.props.text);
      return `Copied "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`;
    }
    case "form_submit":
      if (item.props?.id) return `Submitted form "${item.props.id}"`;
      if (item.props?.action) return `Submitted form to "${item.props.action}"`;
      return "Submitted form";
    case "input_change": {
      const inputType = item.props?.inputType ? `${item.props.inputType} ` : "";
      const inputName = item.props?.name || item.props?.id;
      if (inputName) return `Changed ${inputType}input "${inputName}"`;
      return `Changed ${inputType}input`;
    }
    default:
      return "Event";
  }
}

// Props to hide from badges (already shown in event name or redundant)
export const PROPS_TO_HIDE: Record<string, string[]> = {
  button_click: ["text", "element"],
  copy: ["text"],
  form_submit: ["id", "action"],
  input_change: ["name", "id", "element", "inputName", "inputType"],
};
