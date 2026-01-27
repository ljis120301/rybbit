import { CopyProperties } from "./types.js";
import { Tracker } from "./tracking.js";

export class CopyTrackingManager {
  private tracker: Tracker;

  constructor(tracker: Tracker) {
    this.tracker = tracker;
  }

  initialize(): void {
    document.addEventListener("copy", this.handleCopy.bind(this));
  }

  private handleCopy(): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString();
    const textLength = text.length;

    if (textLength === 0) return;

    // Get the source element of the selection
    const anchorNode = selection.anchorNode;
    const sourceElement = anchorNode instanceof HTMLElement
      ? anchorNode
      : anchorNode?.parentElement;

    if (!sourceElement) return;

    const properties: CopyProperties = {
      textLength,
      sourceElement: sourceElement.tagName.toLowerCase(),
      selector: this.getSelector(sourceElement),
      pathname: window.location.pathname,
    };

    this.tracker.trackCopy(properties);
  }

  private getSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    const parts: string[] = [];
    let current: HTMLElement | null = element;
    let depth = 0;

    while (current && current !== document.body && depth < 5) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${current.id}`;
        parts.unshift(selector);
        break;
      }

      if (current.className) {
        const classes = current.className.split(/\s+/).filter(c => c && !c.includes(":")).slice(0, 2);
        if (classes.length > 0) {
          selector += "." + classes.join(".");
        }
      }

      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(s => s.tagName === current!.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-child(${index})`;
        }
      }

      parts.unshift(selector);
      current = current.parentElement;
      depth++;
    }

    return parts.join(" > ").substring(0, 200);
  }

  cleanup(): void {
    document.removeEventListener("copy", this.handleCopy.bind(this));
  }
}
