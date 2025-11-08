// Duplicated from server/src/services/tracker/utils.ts and getChannel.ts for client-side import processing

import {
  emailAppIds,
  getMediumType,
  getSourceType,
  isMobileAppId,
  isPaidTraffic,
  newsAppIds,
  productivityAppIds,
  searchAppIds,
  shoppingAppIds,
  socialAppIds,
  videoAppIds,
} from "./tracker-const";

// UTM and URL parameter parsing utilities
export function getUTMParams(querystring: string): Record<string, string> {
  const params: Record<string, string> = {};

  if (!querystring) return params;

  try {
    const searchParams = new URLSearchParams(querystring);

    // Extract UTM parameters
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("utm_") || key === "gclid" || key === "gad_source") {
        params[key.toLowerCase()] = value.toLowerCase();
      }
    }
  } catch (e) {
    console.error("Error parsing query string:", e);
  }

  return params;
}

// Parse all URL parameters from querystring
export function getAllUrlParams(querystring: string): Record<string, string> {
  const params: Record<string, string> = {};

  if (!querystring) return params;

  // If querystring starts with ?, remove it
  const cleanQuerystring = querystring.startsWith("?") ? querystring.substring(1) : querystring;

  try {
    const searchParams = new URLSearchParams(cleanQuerystring);
    // Extract all parameters
    for (const [key, value] of searchParams.entries()) {
      params[key.toLowerCase()] = value;
    }
  } catch (e) {
    console.error("Error parsing query string for URL parameters:", e);
  }

  return params;
}

// Clear referrer if it's from the same domain
export function clearSelfReferrer(referrer: string, hostname: string): string {
  if (!referrer || !hostname) return referrer;

  try {
    const referrerUrl = new URL(referrer);
    if (referrerUrl.hostname === hostname) {
      // Internal navigation, clear the referrer
      return "";
    }
  } catch (e) {
    // Invalid URL, return original referrer
  }

  return referrer;
}

// Channel detection logic

function getMobileAppCategory(appId: string): { type: string; isPaid: boolean } | null {
  const appIdLower = appId.toLowerCase();

  if (socialAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Organic Social", isPaid: false };
  }

  if (videoAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Organic Video", isPaid: false };
  }

  if (searchAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Organic Search", isPaid: false };
  }

  if (emailAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Email", isPaid: false };
  }

  if (shoppingAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Organic Shopping", isPaid: false };
  }

  if (newsAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "News", isPaid: false };
  }

  if (productivityAppIds.some((id) => appIdLower.includes(id))) {
    return { type: "Productivity", isPaid: false };
  }

  return null;
}

function getDomainFromReferrer(referrer: string): string {
  if (!referrer) return "$direct";

  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch (e) {
    return "$direct";
  }
}

function isSelfReferral(referringDomain: string, hostname: string): boolean {
  if (!referringDomain || !hostname) return false;

  const stripWww = (domain: string) => domain.replace(/^www\./, "");
  const refDomain = stripWww(referringDomain);
  const currentDomain = stripWww(hostname);

  return refDomain === currentDomain || refDomain.endsWith("." + currentDomain);
}

export function getChannel(referrer: string, querystring: string, hostname?: string): string {
  const utmParams = getUTMParams(querystring);
  const referringDomain = getDomainFromReferrer(referrer);

  const selfReferral = hostname ? isSelfReferral(referringDomain, hostname) : false;

  const utmSource = utmParams["utm_source"] || "";
  const utmMedium = utmParams["utm_medium"] || "";
  const utmCampaign = utmParams["utm_campaign"] || "";
  const gclid = utmParams["gclid"] || "";
  const gadSource = utmParams["gad_source"] || "";

  if (utmSource && isMobileAppId(utmSource)) {
    const appCategory = getMobileAppCategory(utmSource);
    if (appCategory) {
      return appCategory.isPaid ? "Paid " + appCategory.type.split(" ")[1] : appCategory.type;
    }
  }

  if (!referrer && !utmSource && !utmMedium && !utmCampaign && !gclid && !gadSource) {
    return selfReferral ? "Internal" : "Direct";
  }

  const sourceType = getSourceType(utmSource || referringDomain);
  const mediumType = getMediumType(utmMedium);
  const isPaid = isPaidTraffic(utmMedium, utmSource) || gclid !== "" || gadSource !== "";

  // Cross Network
  if (utmCampaign === "cross-network") return "Cross-Network";

  // Direct traffic
  if (
    (referringDomain === "$direct" || (!referrer && !selfReferral)) &&
    !utmMedium &&
    (!utmSource || utmSource === "direct" || utmSource === "(direct)")
  ) {
    return "Direct";
  }

  // Paid channels
  if (isPaid) {
    switch (sourceType) {
      case "search":
        return "Paid Search";
      case "social":
        return "Paid Social";
      case "video":
        return "Paid Video";
      case "shopping":
        return "Paid Shopping";
      default:
        switch (mediumType) {
          case "social":
            return "Paid Social";
          case "video":
            return "Paid Video";
          case "display":
          case "cpm":
            return "Display";
          case "cpc":
            return "Paid Search";
          case "influencer":
            return "Paid Influencer";
          case "audio":
            return "Paid Audio";
          default:
            return "Paid Unknown";
        }
    }
  }

  // Organic channels
  switch (sourceType) {
    case "search":
      return "Organic Search";
    case "social":
      return "Organic Social";
    case "video":
      return "Organic Video";
    case "shopping":
      return "Organic Shopping";
    case "email":
      return "Email";
    case "sms":
      return "SMS";
    case "news":
      return "News";
    case "productivity":
      return "Productivity";
  }

  // Medium-based detection
  switch (mediumType) {
    case "social":
      return "Organic Social";
    case "video":
      return "Organic Video";
    case "affiliate":
      return "Affiliate";
    case "referral":
      return "Referral";
    case "display":
      return "Display";
    case "audio":
      return "Audio";
    case "push":
      return "Push";
    case "influencer":
      return "Influencer";
    case "content":
      return "Content";
    case "event":
      return "Event";
    case "email":
      return "Email";
  }

  // Campaign-based detection
  if (/video/.test(utmCampaign)) return "Organic Video";
  if (/shop|shopping/.test(utmCampaign)) return "Organic Shopping";
  if (/influencer|creator|sponsored/.test(utmCampaign)) return "Influencer";
  if (/event|conference|webinar/.test(utmCampaign)) return "Event";
  if (/social|facebook|twitter|instagram|linkedin/.test(utmCampaign)) return "Organic Social";

  if (referringDomain && referringDomain !== "$direct" && !selfReferral) return "Referral";

  return "Unknown";
}
