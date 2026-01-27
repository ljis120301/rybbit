import { ScriptConfig, ButtonClickProperties } from "./types.js";
import { Tracker } from "./tracking.js";

export class ClickTrackingManager {
  private tracker: Tracker;
  private config: ScriptConfig;

  constructor(tracker: Tracker, config: ScriptConfig) {
    this.tracker = tracker;
    this.config = config;
  }

  initialize(): void {
    document.addEventListener("click", this.handleClick.bind(this), true);
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Track button clicks
    if (this.config.trackButtonClicks && this.isButton(target)) {
      this.trackButtonClick(target);
    }
  }

  private isButton(element: HTMLElement): boolean {
    // Check if element is a button
    if (element.tagName === "BUTTON") return true;
    if (element.getAttribute("role") === "button") return true;
    if (element.tagName === "INPUT") {
      const type = (element as HTMLInputElement).type?.toLowerCase();
      if (type === "submit" || type === "button") return true;
    }

    // Check parent elements up to 3 levels
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
      if (parent.tagName === "BUTTON") return true;
      if (parent.getAttribute("role") === "button") return true;
      parent = parent.parentElement;
      depth++;
    }

    return false;
  }

  private trackButtonClick(element: HTMLElement): void {
    const buttonElement = this.findButton(element);
    if (!buttonElement) return;

    const properties: ButtonClickProperties = {
      element: buttonElement.tagName.toLowerCase(),
      text: this.getElementText(buttonElement),
    };

    this.tracker.trackButtonClick(properties);
  }

  private findButton(element: HTMLElement): HTMLElement | null {
    if (element.tagName === "BUTTON") return element;
    if (element.getAttribute("role") === "button") return element;
    if (element.tagName === "INPUT") {
      const type = (element as HTMLInputElement).type?.toLowerCase();
      if (type === "submit" || type === "button") return element;
    }

    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
      if (parent.tagName === "BUTTON") return parent;
      if (parent.getAttribute("role") === "button") return parent;
      parent = parent.parentElement;
      depth++;
    }

    return null;
  }

  private getElementText(element: HTMLElement): string | undefined {
    const text = element.textContent?.trim().substring(0, 100);
    return text || undefined;
  }

  cleanup(): void {
    document.removeEventListener("click", this.handleClick.bind(this), true);
  }
}
