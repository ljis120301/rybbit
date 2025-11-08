// Web Worker for client-side CSV parsing and transformation
// This worker runs in a separate thread to avoid blocking the main UI thread

import Papa from "papaparse";
import { DateTime } from "luxon";
import type { WorkerMessageToWorker, WorkerMessageToMain, UmamiEvent, RybbitEvent } from "@/lib/import/types";
import { UmamiImportMapper, umamiHeaders } from "@/lib/import/mappers/umami";
import { ClientQuotaChecker } from "@/lib/import/quota-checker";

const CHUNK_SIZE = 5000; // Number of events per batch sent to main thread
const PROGRESS_UPDATE_INTERVAL = 1000; // Update progress every 1000 rows

let quotaChecker: ClientQuotaChecker | null = null;
let currentBatch: RybbitEvent[] = [];
let chunkIndex = 0;
let totalParsed = 0;
let totalSkipped = 0;
let totalErrors = 0;
let errorDetails: Array<{ row: number; message: string }> = [];
let siteId: number;
let importId: string;
let platform: "umami";
let lastProgressUpdate = 0;

// Date range filter
let startDate: DateTime | null = null;
let endDate: DateTime | null = null;

function createDateRangeFilter(startDateStr?: string, endDateStr?: string) {
  startDate = startDateStr
    ? DateTime.fromFormat(startDateStr, "yyyy-MM-dd", { zone: "utc" }).startOf("day")
    : null;
  endDate = endDateStr ? DateTime.fromFormat(endDateStr, "yyyy-MM-dd", { zone: "utc" }).endOf("day") : null;

  if (startDate && !startDate.isValid) {
    throw new Error(`Invalid start date: ${startDateStr}`);
  }

  if (endDate && !endDate.isValid) {
    throw new Error(`Invalid end date: ${endDateStr}`);
  }
}

function isDateInRange(dateStr: string): boolean {
  const createdAt = DateTime.fromFormat(dateStr, "yyyy-MM-dd HH:mm:ss", { zone: "utc" });
  if (!createdAt.isValid) {
    return false;
  }

  if (startDate && createdAt < startDate) {
    return false;
  }

  if (endDate && createdAt > endDate) {
    return false;
  }

  return true;
}

function sendChunk() {
  if (currentBatch.length > 0) {
    const message: WorkerMessageToMain = {
      type: "CHUNK_READY",
      events: currentBatch,
      chunkIndex,
    };
    self.postMessage(message);
    chunkIndex++;
    currentBatch = [];
  }
}

function sendProgress() {
  const message: WorkerMessageToMain = {
    type: "PROGRESS",
    parsed: totalParsed,
    skipped: totalSkipped,
    errors: totalErrors,
  };
  self.postMessage(message);
}

function handleParsedRow(row: unknown, rowIndex: number) {
  // Skip rows with missing or invalid dates
  const umamiEvent = row as UmamiEvent;
  if (!umamiEvent.created_at) {
    totalSkipped++;
    return;
  }

  // Apply user-specified date range filter
  if (!isDateInRange(umamiEvent.created_at)) {
    totalSkipped++;
    return;
  }

  // Check per-month quota
  if (quotaChecker && !quotaChecker.canImportEvent(umamiEvent.created_at)) {
    totalSkipped++;
    return;
  }

  // Transform the event
  const transformed = UmamiImportMapper.transform([umamiEvent], siteId.toString(), importId, (error) => {
    totalErrors++;
    if (errorDetails.length < 100) {
      // Limit error collection
      errorDetails.push({ row: rowIndex, message: error.message });
    }
  });

  if (transformed.length > 0) {
    currentBatch.push(transformed[0]);
    totalParsed++;

    // Send batch when it reaches chunk size
    if (currentBatch.length >= CHUNK_SIZE) {
      sendChunk();
    }
  }

  // Send progress update periodically
  if (totalParsed - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL) {
    sendProgress();
    lastProgressUpdate = totalParsed;
  }
}

function parseCSV(file: File) {
  let rowIndex = 0;

  Papa.parse<UmamiEvent>(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header, index) => {
      // Use predefined Umami headers mapping
      return umamiHeaders[index] || header;
    },
    step: (results) => {
      if (results.data) {
        handleParsedRow(results.data, rowIndex);
        rowIndex++;
      }
      if (results.errors && results.errors.length > 0) {
        totalErrors++;
        if (errorDetails.length < 100) {
          errorDetails.push({
            row: rowIndex,
            message: results.errors.map((e) => e.message).join(", "),
          });
        }
      }
    },
    complete: () => {
      // Send final chunk if any
      sendChunk();

      // Send final progress
      sendProgress();

      // Check if we skipped events due to quota
      const quotaSummary = quotaChecker?.getSummary();
      if (quotaSummary && quotaSummary.monthsAtCapacity > 0 && totalSkipped > 0) {
        const quotaErrorMessage =
          `${totalSkipped} events exceeded monthly quotas or fell outside the ${quotaSummary.totalMonthsInWindow}-month historical window. ` +
          `${quotaSummary.monthsAtCapacity} of ${quotaSummary.totalMonthsInWindow} months are at full capacity. ` +
          `Try importing newer data or upgrade your plan for higher monthly quotas.`;

        errorDetails.push({
          row: 0,
          message: quotaErrorMessage,
        });
      }

      // Send completion message
      const message: WorkerMessageToMain = {
        type: "COMPLETE",
        totalParsed,
        totalSkipped,
        totalErrors,
        errorDetails,
      };
      self.postMessage(message);
    },
    error: (error) => {
      const message: WorkerMessageToMain = {
        type: "ERROR",
        message: error.message,
        error,
      };
      self.postMessage(message);
    },
  });
}

// Listen for messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessageToWorker>) => {
  const message = event.data;

  switch (message.type) {
    case "PARSE_START":
      // Reset state
      currentBatch = [];
      chunkIndex = 0;
      totalParsed = 0;
      totalSkipped = 0;
      totalErrors = 0;
      errorDetails = [];
      lastProgressUpdate = 0;

      // Set up parameters
      siteId = message.siteId;
      importId = message.importId;
      platform = message.platform;

      // Create quota checker
      quotaChecker = new ClientQuotaChecker({
        monthlyLimit: message.monthlyLimit,
        historicalWindowMonths: message.historicalWindowMonths,
        monthlyUsage: message.monthlyUsage,
        currentMonthUsage: 0,
        organizationId: "",
      });

      // Set up date range filter
      createDateRangeFilter(message.startDate, message.endDate);

      // Start parsing
      parseCSV(message.file);
      break;

    case "CANCEL":
      // Terminate the worker
      self.close();
      break;

    default:
      console.warn("Unknown message type:", message);
  }
};

// Export empty object to make TypeScript happy
export {};
