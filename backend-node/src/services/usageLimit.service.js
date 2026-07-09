// src/services/usageLimit.service.js — FREE / PRO / ELITE usage enforcement
const prisma = require('../config/db');
const logger = require('../utils/logger');

// ─── Plan Definitions ─────────────────────────────────────────────────────────
// -1 = unlimited
const PLAN_LIMITS = {
  free: {
    resumeBuilds: 3,    // stored in builtResume table count
    aiWrites: 5,    // per month (feature: 'builder')
    atsChecks: 3,    // per month (feature: 'analyze')
    mockInterviews: 1,    // per month (feature: 'interview')
    coverLetters: 2,    // per month (feature: 'cover_letter')
    jobMatches: 5,    // per month (feature: 'job_match')
    resumeDownloads: 3, // per month (feature: 'resume_download')
  },
  pro: {
    resumeBuilds: -1,   // unlimited
    aiWrites: 500,  // per month
    atsChecks: -1,   // unlimited
    mockInterviews: 30,   // per month
    coverLetters: -1,   // unlimited
    jobMatches: -1,   // unlimited
    resumeDownloads: -1, // unlimited
  },
  elite: {
    resumeBuilds: -1,   // unlimited
    aiWrites: -1,   // unlimited
    atsChecks: -1,   // unlimited
    mockInterviews: -1,   // unlimited
    coverLetters: -1,   // unlimited
    jobMatches: -1,   // unlimited
    resumeDownloads: -1, // unlimited
  },
};

// Map feature names used in token_usage to limit keys
const FEATURE_TO_LIMIT_KEY = {
  analyze: 'atsChecks',
  interview: 'mockInterviews',
  builder: 'aiWrites',
  cover_letter: 'coverLetters',
  job_match: 'jobMatches',
  magic_write: 'aiWrites',
  resume_download: 'resumeDownloads', // Tracked download counts
  ocr: null,          // OCR: not counted
  validate: null,          // validation: not counted
  general: null,          // general: not counted
};

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'vita@genixpay.com').toLowerCase();

/**
 * Get the user's current plan: 'free', 'pro', or 'elite'.
 */
async function getUserPlan(userEmail) {
  // Admin always has elite access
  if (userEmail.toLowerCase() === ADMIN_EMAIL) return 'elite';

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { plan: true, planExpiresAt: true },
  });

  if (!user) return 'free';

  const plan = (user.plan || 'free').toLowerCase();
  if (plan === 'free') return 'free';

  // Check expiry for paid plans
  const isExpired = user.planExpiresAt && new Date(user.planExpiresAt) < new Date();
  if (isExpired) return 'free';

  return plan === 'elite' ? 'elite' : 'pro';
}

/**
 * Count how many times a feature has been used this calendar month.
 */
async function getMonthlyUsage(userEmail, feature) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (!user) return 0;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await prisma.tokenUsage.count({
    where: {
      userId: user.id,
      feature,
      createdAt: { gte: startOfMonth },
    },
  });

  return count;
}

/**
 * Check if a user is allowed to use a feature.
 * Throws a 429 error with upgrade prompt if over limit.
 * Admin users always bypass limits.
 *
 * @param {string} userEmail
 * @param {string} feature — one of the keys in FEATURE_TO_LIMIT_KEY
 */
async function checkUsageLimit(userEmail, feature) {
  // Admin bypasses all limits
  if (userEmail.toLowerCase() === ADMIN_EMAIL) return;

  const limitKey = FEATURE_TO_LIMIT_KEY[feature];
  if (!limitKey) return; // Unknown or non-limited feature — allow

  const plan = await getUserPlan(userEmail);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const limit = limits[limitKey];

  // -1 = unlimited
  if (limit === -1) return;

  const used = await getMonthlyUsage(userEmail, feature);

  if (used >= limit) {
    const nextPlan = plan === 'free' ? 'Pro (₹199/mo)' : 'Elite (₹399/mo)';
    const err = new Error(
      `You've reached your ${plan} plan limit of ${limit} ${limitKey.replace(/([A-Z])/g, ' $1').toLowerCase()} this month. Upgrade to ${nextPlan} for more access.`
    );
    err.status = 429;
    err.code = 'USAGE_LIMIT_EXCEEDED';
    err.details = { feature, limitKey, used, limit, plan, nextPlan };
    throw err;
  }

  logger.debug(`[UsageLimit] ${userEmail} | plan=${plan} | ${feature}(${limitKey}): ${used + 1}/${limit}`);
}

/**
 * Check resume build limit for a user (counted via DB).
 * Call this before creating a new built resume.
 */
async function checkResumeBuildLimit(userEmail) {
  if (userEmail.toLowerCase() === ADMIN_EMAIL) return;

  const plan = await getUserPlan(userEmail);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const limit = limits.resumeBuilds;

  if (limit === -1) return;

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (!user) return;

  const count = await prisma.builtResume.count({ where: { userId: user.id } });

  if (count >= limit) {
    const nextPlan = plan === 'free' ? 'Pro (₹199/mo)' : 'Elite (₹399/mo)';
    const err = new Error(
      `You've reached your ${plan} plan limit of ${limit} resume build${limit === 1 ? '' : 's'}. Upgrade to ${nextPlan} to create more.`
    );
    err.status = 429;
    err.code = 'RESUME_LIMIT_EXCEEDED';
    err.details = { count, limit, plan, nextPlan };
    throw err;
  }
}

/**
 * Get usage summary for a user (for display in the UI).
 */
async function getUsageSummary(userEmail) {
  const plan = await getUserPlan(userEmail);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  const isUnlimited = (val) => val === -1;

  const features = {};
  for (const [feature, limitKey] of Object.entries(FEATURE_TO_LIMIT_KEY)) {
    if (!limitKey) continue;
    const limit = limits[limitKey];
    if (isUnlimited(limit)) {
      features[feature] = { used: null, limit: null, unlimited: true };
    } else {
      const used = await getMonthlyUsage(userEmail, feature);
      features[feature] = { used, limit, unlimited: false };
    }
  }

  // Resume builds
  const resumeLimit = limits.resumeBuilds;
  let resumeCount = null;
  if (!isUnlimited(resumeLimit)) {
    const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } });
    if (user) resumeCount = await prisma.builtResume.count({ where: { userId: user.id } });
  }
  features.resumeBuilds = {
    used: resumeCount,
    limit: isUnlimited(resumeLimit) ? null : resumeLimit,
    unlimited: isUnlimited(resumeLimit),
  };

  return { plan, features };
}

/**
 * Check and record a resume download/export.
 * Throws 429 if the user has reached their limit.
 */
async function checkAndRecordDownload(userEmail) {
  // Check limit (throws if exceeded)
  await checkUsageLimit(userEmail, 'resume_download');

  // If not exceeded, record the usage
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true },
  });
  if (!user) return;

  await prisma.tokenUsage.create({
    data: {
      userId: user.id,
      model: 'none',
      feature: 'resume_download',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      createdAt: new Date(),
    },
  });
}

module.exports = {
  checkUsageLimit,
  checkResumeBuildLimit,
  getUsageSummary,
  getUserPlan,
  checkAndRecordDownload,
};
