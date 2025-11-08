// Client-side quota checking for import validation
// Based on server/src/services/import/importQuotaChecker.ts

import { DateTime } from "luxon";
import { ImportQuotaInfo } from "./types";

export class ClientQuotaChecker {
  private monthlyUsage: Map<string, number>;
  private readonly monthlyLimit: number;
  private readonly historicalWindowMonths: number;
  private readonly oldestAllowedMonth: string;

  constructor(quotaInfo: ImportQuotaInfo) {
    this.monthlyUsage = new Map(Object.entries(quotaInfo.monthlyUsage));
    this.monthlyLimit = quotaInfo.monthlyLimit;
    this.historicalWindowMonths = quotaInfo.historicalWindowMonths;

    const oldestAllowedDate = DateTime.utc().minus({ months: quotaInfo.historicalWindowMonths }).startOf("month");
    this.oldestAllowedMonth = oldestAllowedDate.toFormat("yyyyMM");
  }

  canImportEvent(timestamp: string): boolean {
    if (this.monthlyLimit === Infinity) {
      return true;
    }

    const dt = DateTime.fromFormat(timestamp, "yyyy-MM-dd HH:mm:ss", { zone: "utc" });
    if (!dt.isValid) {
      console.warn("Invalid timestamp format:", timestamp);
      return false;
    }

    const month = dt.toFormat("yyyyMM");

    // Check if event is within historical window
    if (month < this.oldestAllowedMonth) {
      return false;
    }

    const used = this.monthlyUsage.get(month) || 0;
    if (used >= this.monthlyLimit) {
      return false;
    }

    // Update usage tracker
    this.monthlyUsage.set(month, used + 1);
    return true;
  }

  getSummary(): {
    totalMonthsInWindow: number;
    monthsAtCapacity: number;
    monthsWithSpace: number;
    oldestAllowedMonth: string;
  } {
    if (this.monthlyLimit === Infinity) {
      return {
        totalMonthsInWindow: this.historicalWindowMonths,
        monthsAtCapacity: 0,
        monthsWithSpace: this.historicalWindowMonths,
        oldestAllowedMonth: this.oldestAllowedMonth,
      };
    }

    let monthsAtCapacity = 0;
    for (const usage of this.monthlyUsage.values()) {
      if (usage >= this.monthlyLimit) {
        monthsAtCapacity++;
      }
    }

    return {
      totalMonthsInWindow: this.historicalWindowMonths,
      monthsAtCapacity,
      monthsWithSpace: this.historicalWindowMonths - monthsAtCapacity,
      oldestAllowedMonth: this.oldestAllowedMonth,
    };
  }

  getMonthlyUsage(): Record<string, number> {
    return Object.fromEntries(this.monthlyUsage);
  }
}
