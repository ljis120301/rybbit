import { clearSelfReferrer, getAllUrlParams } from "../../tracker/utils.js";
import { getChannel } from "../../tracker/getChannel.js";
import { RybbitEvent } from "./rybbit.js";
import { z } from "zod";
import { DateTime } from "luxon";
import { deriveKeyOnlySchema } from "./utils.js";

interface MatomoActionDetails {
  type?: string;
  url?: string;
  pageTitle?: string;
  timestamp?: string;
}

export interface MatomoEvent {
  // Visit identifiers
  idVisit: string;
  visitorId: string;
  firstActionTimestamp: string;

  // Referrer data
  referrerUrl: string;
  referrerType: string;
  referrerTypeName: string;

  // Browser/OS data (pre-processed by Matomo)
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  operatingSystemVersion: string;
  deviceType: string;

  // Language and geo
  languageCode: string;
  country: string;
  countryCode: string;
  region: string;
  regionCode: string;
  city: string;
  latitude: string;
  longitude: string;
  resolution: string;

  // Campaign data (optional)
  campaignName: string;
  campaignSource: string;
  campaignMedium: string;
  campaignContent: string;
  campaignKeyword: string;

  // Dynamic action details (indexed 0-101)
  [key: `actionDetails_${number}_type`]: string;
  [key: `actionDetails_${number}_url`]: string;
  [key: `actionDetails_${number}_pageTitle`]: string;
  [key: `actionDetails_${number}_timestamp`]: string;
}

export class MatomoImportMapper {
  private static readonly browserMap: Record<string, string> = {
    "samsung browser": "Samsung Internet",
    chrome: "Chrome",
    "mobile chrome": "Mobile Chrome",
    firefox: "Firefox",
    "mobile firefox": "Mobile Firefox",
    safari: "Safari",
    "mobile safari": "Mobile Safari",
    edge: "Edge",
    opera: "Opera",
    "yandex browser": "Yandex",
  };

  private static readonly osMap: Record<string, string> = {
    "mac os x": "macOS",
    "mac os": "macOS",
    android: "Android",
    ios: "iOS",
    windows: "Windows",
    linux: "Linux",
    "chrome os": "Chrome OS",
  };

  private static readonly deviceMap: Record<string, string> = {
    smartphone: "Mobile",
    desktop: "Desktop",
    tablet: "Mobile",
  };

  private static normalizeBrowserName(browser: string): string {
    // Remove version numbers from browser string
    // "Samsung Browser 29.0" -> "Samsung Browser"
    const browserName = browser.replace(/\s+[\d.]+$/i, "").trim();
    const key = browserName.toLowerCase();
    return this.browserMap[key] ?? browserName;
  }

  private static normalizeOSName(os: string): string {
    // Remove version numbers from OS string
    // "Android 15.0" -> "Android"
    const osName = os.replace(/\s+[\d.]+$/i, "").trim();
    const key = osName.toLowerCase();
    return this.osMap[key] ?? osName;
  }

  private static normalizeDeviceType(deviceType: string): string {
    const key = deviceType.toLowerCase();
    return this.deviceMap[key] ?? deviceType;
  }

  private static extractActionDetails(visit: any): MatomoActionDetails[] {
    const actionMap = new Map<number, MatomoActionDetails>();

    for (const [key, value] of Object.entries(visit)) {
      const match = key.match(/^actionDetails_(\d+)_(\w+)$/);
      if (!match) continue;

      const index = parseInt(match[1], 10);
      const field = match[2];

      if (!actionMap.has(index)) {
        actionMap.set(index, {});
      }

      const action = actionMap.get(index)!;
      (action as any)[field] = value;
    }

    // Convert map to sorted array and filter for pageviews only
    return Array.from(actionMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([_, action]) => action)
      .filter(action => action.type === "action");
  }

  private static parseUrl(url: string): { hostname: string; pathname: string; querystring: string } {
    try {
      const urlObj = new URL(url);
      return {
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        querystring: urlObj.search,
      };
    } catch {
      return { hostname: "", pathname: "", querystring: "" };
    }
  }

  private static readonly matomoEventSchema = z
    .object({
      // Visit identifiers
      idVisit: z.string().max(50),
      visitorId: z.string().max(64),
      firstActionTimestamp: z.string().regex(/^\d+$/),

      // Referrer data
      referrerUrl: z.string().max(2048),
      referrerType: z.string().max(10),
      referrerTypeName: z.string().max(50),

      // Browser/OS data
      browser: z.string().max(100),
      browserVersion: z.string().max(20),
      operatingSystem: z.string().max(100),
      operatingSystemVersion: z.string().max(20),
      deviceType: z.string().max(30),

      // Language and geo
      languageCode: z.string().max(10),
      country: z.string().max(100),
      countryCode: z
        .string()
        .regex(/^[A-Z]{2}$/)
        .or(z.literal("")),
      region: z.string().max(100),
      regionCode: z.string().max(10),
      city: z.string().max(100),
      latitude: z
        .string()
        .regex(/^-?\d+(\.\d+)?$/)
        .or(z.literal("")),
      longitude: z
        .string()
        .regex(/^-?\d+(\.\d+)?$/)
        .or(z.literal("")),
      resolution: z
        .string()
        .regex(/^\d{1,5}x\d{1,5}$/)
        .or(z.literal("")),

      // Campaign data (all optional, can be empty)
      campaignName: z.string().max(256),
      campaignSource: z.string().max(256),
      campaignMedium: z.string().max(256),
      campaignContent: z.string().max(256),
      campaignKeyword: z.string().max(256),
    })
    .passthrough(); // Allow additional properties for actionDetails_N_*

  static readonly matomoEventKeyOnlySchema = deriveKeyOnlySchema(MatomoImportMapper.matomoEventSchema);

  static transform(visits: any[], site: number, importId: string): RybbitEvent[] {
    return visits.reduce<RybbitEvent[]>((acc, visit) => {
      // Step 1: Validate visit structure
      const parsed = MatomoImportMapper.matomoEventSchema.safeParse(visit);
      if (!parsed.success) {
        return acc; // Skip invalid visits gracefully
      }

      const data = parsed.data;

      // Step 2: Extract all action details from the visit
      const actions = MatomoImportMapper.extractActionDetails(visit);

      // Step 3: Transform each action into a RybbitEvent
      for (const action of actions) {
        // Validate action has required fields
        if (!action.url || !action.timestamp) {
          continue; // Skip incomplete actions
        }

        // Parse URL components
        const { hostname, pathname, querystring } = MatomoImportMapper.parseUrl(action.url);

        // Parse screen dimensions
        const [screenWidth, screenHeight] = data.resolution
          ? data.resolution.split("x").map(d => parseInt(d, 10))
          : [0, 0];

        // Parse geo coordinates
        const lat = data.latitude ? parseFloat(data.latitude) : 0;
        const lon = data.longitude ? parseFloat(data.longitude) : 0;

        // Normalize browser/OS/device
        const browser = MatomoImportMapper.normalizeBrowserName(data.browser);
        const os = MatomoImportMapper.normalizeOSName(data.operatingSystem);
        const deviceType = MatomoImportMapper.normalizeDeviceType(data.deviceType);

        // Convert Unix timestamp to "yyyy-MM-dd HH:mm:ss"
        let timestamp: string;
        try {
          timestamp = DateTime.fromSeconds(parseInt(action.timestamp, 10)).toFormat("yyyy-MM-dd HH:mm:ss");
        } catch {
          continue; // Skip action with invalid timestamp
        }

        // Build referrer URL
        const referrer = clearSelfReferrer(data.referrerUrl, hostname.replace(/^www\./, ""));

        // Generate session ID (use visit ID + action timestamp for uniqueness)
        const sessionId = `${data.idVisit}-${action.timestamp}`;

        // Build campaign querystring if present
        let campaignQuery = "";
        if (data.campaignSource || data.campaignMedium || data.campaignName) {
          const params = new URLSearchParams();
          if (data.campaignSource) params.set("utm_source", data.campaignSource);
          if (data.campaignMedium) params.set("utm_medium", data.campaignMedium);
          if (data.campaignName) params.set("utm_campaign", data.campaignName);
          if (data.campaignContent) params.set("utm_content", data.campaignContent);
          if (data.campaignKeyword) params.set("utm_term", data.campaignKeyword);
          campaignQuery = params.toString();
        }

        // Merge campaign params with URL querystring
        const urlQuery = querystring.replace(/^\?/, "");
        const mergedQuery =
          urlQuery && campaignQuery
            ? `${urlQuery}&${campaignQuery}`
            : urlQuery || campaignQuery;
        const finalQuerystring = mergedQuery ? `?${mergedQuery}` : "";

        acc.push({
          site_id: site,
          timestamp,
          session_id: sessionId,
          user_id: data.visitorId,
          hostname,
          pathname,
          querystring: finalQuerystring,
          url_parameters: getAllUrlParams(finalQuerystring),
          page_title: action.pageTitle || "",
          referrer,
          channel: getChannel(referrer, finalQuerystring, hostname),
          browser,
          browser_version: data.browserVersion,
          operating_system: os,
          operating_system_version: data.operatingSystemVersion,
          language: data.languageCode,
          country: data.countryCode,
          region: data.regionCode,
          city: data.city,
          lat,
          lon,
          screen_width: screenWidth,
          screen_height: screenHeight,
          device_type: deviceType,
          type: "pageview",
          event_name: "",
          props: {},
          import_id: importId,
        });
      }

      return acc;
    }, []);
  }
}
