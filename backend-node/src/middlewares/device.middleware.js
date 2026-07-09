const { parseUserAgent } = require('../utils/deviceDetector');

/**
 * Express middleware to parse device info and attach it to req.device.
 */
function deviceMiddleware(req, res, next) {
  const userAgent = req.headers['user-agent'] || '';
  const deviceInfo = parseUserAgent(userAgent);

  // Extract client IP address (supporting reverse proxies)
  let ip = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '';
  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  req.device = {
    type: deviceInfo.deviceType,
    os: deviceInfo.os,
    browser: deviceInfo.browser,
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isDesktop: deviceInfo.isDesktop,
    ipAddress: ip
  };

  next();
}

module.exports = deviceMiddleware;
