// Types for client-side CSV import system

export interface RybbitEvent {
  site_id: number;
  timestamp: string;
  session_id: string;
  user_id: string;
  hostname: string;
  pathname: string;
  querystring: string;
  url_parameters: Record<string, string>;
  page_title: string;
  referrer: string;
  channel: string;
  browser: string;
  browser_version: string;
  operating_system: string;
  operating_system_version: string;
  language: string;
  country: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  screen_width: number;
  screen_height: number;
  device_type: string;
  type: string;
  event_name: string;
  props: Record<string, unknown>;
  import_id: string;
}

export interface UmamiEvent {
  session_id: string;
  hostname: string;
  browser: string;
  os: string;
  device: string;
  screen: string;
  language: string;
  country: string;
  region: string;
  city: string;
  url_path: string;
  url_query: string;
  referrer_path: string;
  referrer_query: string;
  referrer_domain: string;
  page_title: string;
  event_type: string;
  event_name: string;
  distinct_id: string;
  created_at: string;
}

// Worker message types
export type WorkerMessageToWorker =
  | {
      type: "PARSE_START";
      file: File;
      siteId: number;
      importId: string;
      platform: "umami";
      startDate?: string;
      endDate?: string;
      monthlyLimit: number;
      historicalWindowMonths: number;
      monthlyUsage: Record<string, number>;
    }
  | {
      type: "CANCEL";
    };

export type WorkerMessageToMain =
  | {
      type: "PROGRESS";
      parsed: number;
      skipped: number;
      errors: number;
    }
  | {
      type: "CHUNK_READY";
      events: RybbitEvent[];
      chunkIndex: number;
    }
  | {
      type: "COMPLETE";
      totalParsed: number;
      totalSkipped: number;
      totalErrors: number;
      errorDetails: Array<{ row: number; message: string }>;
    }
  | {
      type: "ERROR";
      message: string;
      error?: unknown;
    };

// Quota information from server
export interface ImportQuotaInfo {
  monthlyLimit: number;
  historicalWindowMonths: number;
  monthlyUsage: Record<string, number>; // { "202401": 5000, "202402": 7500, ... }
  currentMonthUsage: number;
  organizationId: string;
}

// Batch import request
export interface BatchImportRequest {
  events: RybbitEvent[];
  importId: string;
  batchIndex: number;
  totalBatches: number;
}

// Batch import response
export interface BatchImportResponse {
  success: boolean;
  importedCount: number;
  message?: string;
  error?: string;
}

// Import progress tracking
export interface ImportProgress {
  status: "idle" | "parsing" | "uploading" | "completed" | "failed";
  totalRows: number;
  parsedRows: number;
  skippedRows: number;
  uploadedBatches: number;
  totalBatches: number;
  failedBatches: number;
  importedEvents: number;
  errors: Array<{ batch?: number; message: string }>;
}

// Failed batch info for retry
export interface FailedBatch {
  batchIndex: number;
  events: RybbitEvent[];
  error: string;
  retryCount: number;
}
