export interface DeviceDetails {
  deviceType: "mobile" | "tablet" | "desktop";
  os: string;
  browser: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Parses a user agent string into structured device details.
 */
export function parseUserAgent(ua: string | null): DeviceDetails {
  if (!ua) {
    return {
      deviceType: "desktop",
      os: "Windows",
      browser: "Chrome",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  const uaLower = ua.toLowerCase();

  // 1. Device Type
  let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
  let isMobile = false;
  let isTablet = false;
  let isDesktop = true;

  if (/ipad|playbook|silk/i.test(uaLower) || (/android/i.test(uaLower) && !/mobile/i.test(uaLower))) {
    deviceType = "tablet";
    isTablet = true;
    isDesktop = false;
  } else if (/mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(uaLower)) {
    deviceType = "mobile";
    isMobile = true;
    isDesktop = false;
  }

  // 2. Operating System
  let os = "Windows";
  if (/windows/i.test(uaLower)) {
    os = "Windows";
  } else if (/iphone|ipad|ipod/i.test(uaLower)) {
    os = "iOS";
  } else if (/macintosh|mac os x/i.test(uaLower)) {
    os = "macOS";
  } else if (/android/i.test(uaLower)) {
    os = "Android";
  } else if (/linux/i.test(uaLower)) {
    os = "Linux";
  }

  // 3. Browser
  let browser = "Chrome";
  if (/opr\/|opera/i.test(uaLower)) {
    browser = "Opera";
  } else if (/edg\/|edge/i.test(uaLower)) {
    browser = "Edge";
  } else if (/firefox/i.test(uaLower)) {
    browser = "Firefox";
  } else if (/chrome|crios/i.test(uaLower)) {
    browser = "Chrome";
  } else if (/safari/i.test(uaLower) && !/chrome|crios/i.test(uaLower)) {
    browser = "Safari";
  }

  return {
    deviceType,
    os,
    browser,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Prepares a client-side reusable payload object for payment gateway integration.
 */
export function prepareClientPaymentPayload(userId: string | null) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const width = typeof window !== "undefined" ? window.innerWidth : 1024;

  let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
  if (width < 768) {
    deviceType = "mobile";
  } else if (width >= 768 && width < 1024) {
    deviceType = "tablet";
  }

  let os = "Windows";
  if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/macintosh/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  let browser = "Chrome";
  if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/edge/i.test(ua)) browser = "Edge";

  return {
    userId,
    deviceType,
    deviceOS: os,
    browser,
    platform: "web",
    ipAddress: "client-side", // populated/verified on server
    timestamp: new Date().toISOString(),
  };
}
