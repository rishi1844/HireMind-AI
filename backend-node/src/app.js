// src/app.js — Express application setup
const express = require('express');
const path = require('path');
const corsMiddleware = require('./config/cors');
const errorMiddleware = require('./middlewares/error.middleware');
const deviceMiddleware = require('./middlewares/device.middleware');
const logger = require('./utils/logger');
const {
  authLimiter,
  analysisLimiter,
  interviewLimiter,
  builderAiLimiter,
  generalLimiter,
} = require('./config/rateLimit');

// Routes
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const resumeBuilderRoutes = require('./routes/resumeBuilder.routes');
const interviewRoutes = require('./routes/interview.routes');
const adminRoutes = require('./routes/admin.routes');
const testRoutes  = require('./routes/test.routes');
const coverLetterRoutes = require('./routes/coverLetter.routes');
const jobMatchRoutes = require('./routes/jobMatch.routes');
const builderTipsRoutes = require('./routes/builderTips.routes');
const usageRoutes = require('./routes/usage.routes');
const chatRoutes = require('./routes/chat.routes');


const app = express();
app.set('trust proxy', true);

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(deviceMiddleware);

// ─── General Rate Limiting (all routes) ──────────────────────────────────────
app.use(generalLimiter);

// ─── Static file serving (profile pictures) ─────────────────────────────────
app.use('/uploads', express.static(path.resolve('./uploads')));

// ─── Request logging ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// ─── Health endpoint (must be before route mounts) ───────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Vita AI Node.js Backend', timestamp: new Date().toISOString() });
});

// ─── Public test routes (no auth required) ───────────────────────────────────
// Mounted at /test (outside /api) so auth middleware on resumeRoutes never intercepts it
app.use('/test', testRoutes);

// ─── API Routes ───────────────────────────────────────────────────────────────
// IMPORTANT: admin routes MUST be registered before the generic /api mounts
// because resumeRoutes & interviewRoutes are mounted at '/api' with global auth
// middleware — they would intercept /api/admin/* and block admin login with 401.
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authLimiter, authRoutes);           // 20 req / 15 min

// Mount specific prefixes first so they are not intercepted by generic /api auth
app.use('/api/resume-builder', resumeBuilderRoutes);     // builder AI has its own limiter
app.use('/api/resume-builder', builderTipsRoutes);       // Phase 3.3: Real-time tips
app.use('/api/cover-letter', coverLetterRoutes);         // Phase 3.1: AI cover letter
app.use('/api/job-match', jobMatchRoutes);               // Phase 3.2: JD matcher
app.use('/api/usage', usageRoutes);                      // Phase 4.1: Usage summary
app.use('/api/chatbot', chatRoutes);                     // Phase 5.0: AI Career Copilot Chatbot

// Mount generic /api endpoints last
app.use('/api', resumeRoutes);                           // analyze has its own limiter (applied in route)
app.use('/api', interviewRoutes);                        // interview has its own limiter


// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
