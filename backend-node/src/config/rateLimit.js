const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// ─── Helper: create a rate limiter with consistent options ────────────────────
function createLimiter({ windowMinutes, max, message }) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,     // Disable old `X-RateLimit-*` headers
    message: { message },
    validate: { trustProxy: false },
    // Key by user email if authenticated, otherwise by IP (IPv6-safe via ipKeyGenerator)
    keyGenerator: (req) => {
      if (req.user?.email) return req.user.email;
      return ipKeyGenerator(req); // handles IPv4 and IPv6 correctly
    },
    skip: () => {
      // Skip rate limiting ONLY when explicitly disabled (e.g. DISABLE_RATE_LIMIT=true in dev/test)
      return process.env.DISABLE_RATE_LIMIT === 'true';
    },
    handler: (_req, res) => {
      res.status(429).json({ message });
    },
  });
}

// ─── Auth routes: 20 requests per 15 minutes (brute-force protection) ─────────
const authLimiter = createLimiter({
  windowMinutes: 15,
  max: 20,
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
});

// ─── AI Analysis: 10 per hour per user (OpenAI cost control) ──────────────────
const analysisLimiter = createLimiter({
  windowMinutes: 60,
  max: 10,
  message: 'You have used your hourly analysis limit (10). Please wait before analyzing again.',
});

// ─── Interview/AI: 15 per hour per user ───────────────────────────────────────
const interviewLimiter = createLimiter({
  windowMinutes: 60,
  max: 15,
  message: 'You have reached the interview question limit (15/hour). Please try again later.',
});

// ─── Resume Builder AI (field generation): 30 per hour ───────────────────────
const builderAiLimiter = createLimiter({
  windowMinutes: 60,
  max: 30,
  message: 'AI writing limit reached (30/hour). Please wait before generating more content.',
});

// ─── General API: 200 requests per 15 minutes (DDoS protection) ───────────────
const generalLimiter = createLimiter({
  windowMinutes: 15,
  max: 200,
  message: 'Too many requests. Please slow down.',
});

module.exports = {
  authLimiter,
  analysisLimiter,
  interviewLimiter,
  builderAiLimiter,
  generalLimiter,
};
