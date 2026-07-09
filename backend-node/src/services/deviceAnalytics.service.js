const prisma = require('../config/db');

/**
 * Safely logs a device action to the DeviceAnalytics table.
 * @param {string|number|BigInt|null} userIdentifier Either email (string) or userId (number/BigInt)
 * @param {object} deviceDetails req.device
 * @param {string} action signup | login | start_interview | use_builder | payment
 * @param {string} ipAddress client IP address
 * @param {string} userAgent user agent header
 */
async function logDeviceAction(userIdentifier, deviceDetails, action, ipAddress, userAgent) {
  try {
    let finalUserId = null;

    if (userIdentifier) {
      if (typeof userIdentifier === 'string' && userIdentifier.includes('@')) {
        // Resolve email to user ID
        const resolvedUser = await prisma.user.findUnique({
          where: { email: userIdentifier },
          select: { id: true }
        });
        if (resolvedUser) {
          finalUserId = resolvedUser.id;
        }
      } else {
        // Assume numeric or BigInt user ID
        finalUserId = BigInt(userIdentifier);
      }
    }

    const deviceType = deviceDetails?.type || 'desktop';
    const os = deviceDetails?.os || 'Windows';
    const browser = deviceDetails?.browser || 'Chrome';
    const ip = ipAddress || '';
    const ua = userAgent ? userAgent.substring(0, 500) : '';

    await prisma.deviceAnalytics.create({
      data: {
        userId: finalUserId,
        deviceType,
        os,
        browser,
        action,
        ipAddress: ip,
        userAgent: ua,
        createdAt: new Date()
      }
    });
  } catch (error) {
    // Fail-safe: log locally but do not crash user requests on logging failures
    console.error('[DeviceAnalytics] Failed to log device action:', error.message);
  }
}

/**
 * Fetches aggregated device statistics for the admin dashboard.
 * @returns {object} Device, Browser, and OS counts
 */
async function getAnalyticsSummary() {
  try {
    const [deviceCounts, osCounts, browserCounts] = await Promise.all([
      prisma.deviceAnalytics.groupBy({
        by: ['deviceType'],
        _count: { id: true }
      }),
      prisma.deviceAnalytics.groupBy({
        by: ['os'],
        _count: { id: true }
      }),
      prisma.deviceAnalytics.groupBy({
        by: ['browser'],
        _count: { id: true }
      })
    ]);

    // Format aggregates safely to avoid BigInt issues
    const devices = { mobile: 0, tablet: 0, desktop: 0 };
    deviceCounts.forEach(d => {
      const type = d.deviceType;
      if (type === 'mobile' || type === 'tablet' || type === 'desktop') {
        devices[type] = Number(d._count.id);
      }
    });

    const os = {};
    osCounts.forEach(o => {
      os[o.os] = Number(o._count.id);
    });

    const browsers = {};
    browserCounts.forEach(b => {
      browsers[b.browser] = Number(b._count.id);
    });

    return {
      devices,
      os,
      browsers
    };
  } catch (error) {
    console.error('[DeviceAnalytics] Failed to compile analytics summary:', error.message);
    return {
      devices: { mobile: 0, tablet: 0, desktop: 0 },
      os: {},
      browsers: {}
    };
  }
}

module.exports = {
  logDeviceAction,
  getAnalyticsSummary
};
