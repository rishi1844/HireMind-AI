/**
 * Parses user-agent string into device type, OS, and browser info.
 * @param {string} ua User agent header
 * @returns {object} Device info object
 */
function parseUserAgent(ua) {
  if (!ua) {
    return {
      deviceType: 'desktop',
      os: 'Windows',
      browser: 'Chrome',
      isMobile: false,
      isTablet: false,
      isDesktop: true
    };
  }

  const uaLower = ua.toLowerCase();

  // 1. Device Type
  let deviceType = 'desktop';
  let isMobile = false;
  let isTablet = false;
  let isDesktop = true;

  if (/ipad|playbook|silk/i.test(uaLower) || (/android/i.test(uaLower) && !/mobile/i.test(uaLower))) {
    deviceType = 'tablet';
    isTablet = true;
    isDesktop = false;
  } else if (/mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(uaLower)) {
    deviceType = 'mobile';
    isMobile = true;
    isDesktop = false;
  }

  // 2. Operating System
  let os = 'Windows';
  if (/windows/i.test(uaLower)) {
    os = 'Windows';
  } else if (/iphone|ipad|ipod/i.test(uaLower)) {
    os = 'iOS';
  } else if (/macintosh|mac os x/i.test(uaLower)) {
    os = 'macOS';
  } else if (/android/i.test(uaLower)) {
    os = 'Android';
  } else if (/linux/i.test(uaLower)) {
    os = 'Linux';
  }

  // 3. Browser
  let browser = 'Chrome';
  if (/opr\/|opera/i.test(uaLower)) {
    browser = 'Opera';
  } else if (/edg\/|edge/i.test(uaLower)) {
    browser = 'Edge';
  } else if (/firefox/i.test(uaLower)) {
    browser = 'Firefox';
  } else if (/chrome|crios/i.test(uaLower)) {
    browser = 'Chrome';
  } else if (/safari/i.test(uaLower) && !/chrome|crios/i.test(uaLower)) {
    browser = 'Safari';
  }

  return {
    deviceType,
    os,
    browser,
    isMobile,
    isTablet,
    isDesktop
  };
}

/**
 * Prepares a reusable payload object for future payment gateway integrations.
 * @param {object} req Express request object
 * @param {string|number|BigInt} userId User ID context
 * @returns {object} Reusable payment payload
 */
function preparePaymentPayload(req, userId) {
  return {
    userId: userId ? String(userId) : null,
    deviceType: req.device?.type || 'desktop',
    deviceOS: req.device?.os || 'Windows',
    browser: req.device?.browser || 'Chrome',
    platform: 'web',
    ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  parseUserAgent,
  preparePaymentPayload
};
