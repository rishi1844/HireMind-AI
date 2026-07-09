// src/controllers/admin.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/db');
const logger = require('../utils/logger');
const { generateOtp, expiresAt, isExpired } = require('../utils/otp.utils');
const { sendAdminPasswordResetOtp } = require('../services/authEmail.service');
const deviceAnalyticsService = require('../services/deviceAnalytics.service');

let ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'vita@genixpay.com';
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Vita2026';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin_vita_fallback_secret_2026';
const ADMIN_JWT_EXPIRES = '12h';

// Revenue per plan in INR (monthly) — Pro ₹199, Elite ₹399
const PLAN_PRICE = { free: 0, pro: 199, elite: 399 };

// In-memory OTP store for admin password reset (single admin account)
// { otp, expiresAt, resetToken }
let _adminOtpStore = null;

const OTP_EXPIRY_MINUTES = 10;
const RESET_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// ─── POST /api/admin/login ────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }
    const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD).catch(() => false);
    const isValid = passwordMatch || password === ADMIN_PASSWORD;
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid admin credentials.' });
    }
    const token = jwt.sign(
      { email: ADMIN_EMAIL, isAdmin: true },
      ADMIN_JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES }
    );
    res.json({ token, email: ADMIN_EMAIL, expiresIn: ADMIN_JWT_EXPIRES });
  } catch (err) { next(err); }
}

// ─── POST /api/admin/forgot-password ─────────────────────────────────────────
// Sends OTP to the admin email (vita@genixpay.com)
async function forgotPassword(req, res, next) {
  try {
    // We don't reveal whether the email matches — always respond 200
    const otp = generateOtp();
    _adminOtpStore = {
      otp,
      expiresAt: expiresAt(OTP_EXPIRY_MINUTES),
      resetToken: null, // will be set after OTP is verified
    };

    try {
      await sendAdminPasswordResetOtp(ADMIN_EMAIL, otp, OTP_EXPIRY_MINUTES);
      logger.info(`[Admin] Password reset OTP sent to ${ADMIN_EMAIL}`);
    } catch (mailErr) {
      logger.error(`[Admin] Failed to send reset OTP: ${mailErr.message}`);
      // Still respond success to not reveal admin email
    }

    res.json({
      message: `Password reset OTP has been sent to the admin email. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    });
  } catch (err) { next(err); }
}

// ─── POST /api/admin/verify-otp ──────────────────────────────────────────────
// Verifies the OTP; returns a short-lived resetToken on success
async function verifyOtp(req, res, next) {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP is required.' });

    if (!_adminOtpStore || !_adminOtpStore.otp) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new one.' });
    }
    if (isExpired(_adminOtpStore.expiresAt)) {
      _adminOtpStore = null;
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (_adminOtpStore.otp !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Issue a one-time reset token (16 bytes hex, valid 15 min)
    const resetToken = crypto.randomBytes(16).toString('hex');
    _adminOtpStore = {
      otp: null, // invalidate OTP after use
      expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
      resetToken,
    };

    logger.info('[Admin] OTP verified — reset token issued');
    res.json({ message: 'OTP verified successfully.', resetToken });
  } catch (err) { next(err); }
}

// ─── POST /api/admin/reset-password ──────────────────────────────────────────
// Validates resetToken and sets the new admin password
async function resetPassword(req, res, next) {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) {
      return res.status(400).json({ message: 'Reset token and new password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    if (!_adminOtpStore || !_adminOtpStore.resetToken) {
      return res.status(400).json({ message: 'No active reset session. Please request a new OTP.' });
    }
    if (isExpired(_adminOtpStore.expiresAt)) {
      _adminOtpStore = null;
      return res.status(400).json({ message: 'Reset session expired. Please request a new OTP.' });
    }
    if (_adminOtpStore.resetToken !== resetToken) {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }

    // Update in-memory admin password (persists for the lifetime of the process)
    ADMIN_PASSWORD = password;
    _adminOtpStore = null;

    logger.info('[Admin] Password reset successfully');
    res.json({ message: 'Admin password reset successfully. Please log in with your new password.' });
  } catch (err) { next(err); }
}

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
async function getStats(req, res, next) {
  try {
    const [totalUsers, totalResumes, totalAnalyses, totalSessions, totalBuilt, totalTokens, planCounts, deviceStats] = await Promise.all([
      prisma.user.count(),
      prisma.resume.count(),
      prisma.analysisResult.count(),
      prisma.interviewSession.count(),
      prisma.builtResume.count(),
      prisma.tokenUsage.aggregate({ _sum: { totalTokens: true } }),
      prisma.user.groupBy({ by: ['plan'], _count: { id: true } }),
      deviceAnalyticsService.getAnalyticsSummary(),
    ]);

    // Ensure all planMap values are plain Numbers (Prisma _count can be BigInt)
    const planMap = {};
    planCounts.forEach(p => { planMap[p.plan] = Number(p._count.id); });

    const premiumUsers = (planMap['pro'] || 0) + (planMap['elite'] || 0);
    const freeUsers = planMap['free'] || (totalUsers - premiumUsers);
    const monthlyRevenue = (planMap['pro'] || 0) * PLAN_PRICE.pro + (planMap['elite'] || 0) * PLAN_PRICE.elite;

    // Signup trend last 7 days — convert BigInt count to Number to avoid JSON serialization error
    const signupTrendRaw = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const signupTrend = signupTrendRaw.map(r => ({
      date: String(r.date).substring(0, 10),
      count: Number(r.count),
    }));

    res.json({
      totalUsers: Number(totalUsers),
      totalResumes: Number(totalResumes),
      totalAnalyses: Number(totalAnalyses),
      totalInterviews: Number(totalSessions),
      totalBuiltResumes: Number(totalBuilt),
      totalTokensUsed: Number(totalTokens._sum.totalTokens || 0),
      premiumUsers,
      freeUsers,
      monthlyRevenue,
      planBreakdown: planMap,
      signupTrend,
      deviceStats,
    });
  } catch (err) { next(err); }
}

// ─── GET /api/admin/users ────────────────────────────────────────────────────
async function getUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 15);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const planFilter = req.query.plan || '';

    const where = {};
    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }
    if (planFilter && planFilter !== 'all') {
      if (planFilter === 'premium') {
        where.plan = { in: ['pro', 'elite'] };
      } else if (planFilter === 'free') {
        where.plan = 'free';
      } else {
        where.plan = planFilter;
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, createdAt: true,
          emailVerified: true, plan: true, planExpiresAt: true,
          _count: { select: { resumes: true, interviewSessions: true, builtResumes: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const userIds = users.map(u => u.id);
    const tokensByUser = await prisma.tokenUsage.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _sum: { totalTokens: true },
    });
    const tokenMap = Object.fromEntries(tokensByUser.map(t => [t.userId.toString(), t._sum.totalTokens || 0]));

    const enriched = users.map(u => ({
      id: u.id.toString(),
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      emailVerified: u.emailVerified,
      plan: u.plan || 'free',
      planExpiresAt: u.planExpiresAt,
      resumes: u._count.resumes,
      interviews: u._count.interviewSessions,
      builtResumes: u._count.builtResumes,
      tokensUsed: tokenMap[u.id.toString()] || 0,
    }));

    res.json({ users: enriched, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

// ─── GET /api/admin/users/:id ───────────────────────────────────────────────
async function getUserDetail(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(req.params.id) },
      select: {
        id: true, name: true, email: true, createdAt: true, headline: true,
        plan: true, planExpiresAt: true, emailVerified: true,
        resumes: {
          orderBy: { uploadedAt: 'desc' },
          take: 10,
          select: { id: true, fileName: true, uploadedAt: true, analysisResult: { select: { atsScore: true } } },
        },
        interviewSessions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, sessionTitle: true, overallScore: true, createdAt: true },
        },
      },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tokenData = await prisma.tokenUsage.groupBy({
      by: ['feature', 'model'],
      where: { userId: BigInt(req.params.id) },
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
    });

    res.json({
      ...user,
      id: user.id.toString(),
      plan: user.plan || 'free',
      resumes: user.resumes.map(r => ({ ...r, id: r.id.toString() })),
      interviewSessions: user.interviewSessions.map(s => ({ ...s, id: s.id.toString() })),
      tokenUsage: tokenData,
    });
  } catch (err) { next(err); }
}

// ─── GET /api/admin/token-usage ─────────────────────────────────────────────
async function getTokenUsage(req, res, next) {
  try {
    const [byModel, byFeature, daily] = await Promise.all([
      prisma.tokenUsage.groupBy({
        by: ['model'],
        _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
        _count: { id: true },
      }),
      prisma.tokenUsage.groupBy({
        by: ['feature'],
        _sum: { totalTokens: true },
        _count: { id: true },
      }),
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, model, SUM(total_tokens) as tokens
        FROM token_usage
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at), model
        ORDER BY date DESC
      `,
    ]);

    // Convert BigInt from raw SQL to Number
    const dailySafe = daily.map(r => ({
      date: String(r.date).substring(0, 10),
      model: String(r.model),
      tokens: Number(r.tokens),
    }));

    res.json({
      byModel: byModel.map(r => ({
        model: r.model,
        totalTokens: r._sum.totalTokens || 0,
        promptTokens: r._sum.promptTokens || 0,
        completionTokens: r._sum.completionTokens || 0,
        calls: r._count.id,
      })),
      byFeature: byFeature.map(r => ({
        feature: r.feature,
        totalTokens: r._sum.totalTokens || 0,
        calls: r._count.id,
      })),
      daily: dailySafe,
    });
  } catch (err) { next(err); }
}

// ─── PATCH /api/admin/users/:id/plan ────────────────────────────────────────
async function updateUserPlan(req, res, next) {
  try {
    const { plan } = req.body;
    const allowed = ['free', 'pro', 'elite'];
    if (!plan || !allowed.includes(plan)) {
      return res.status(400).json({ message: `Plan must be one of: ${allowed.join(', ')}` });
    }

    // Set planExpiresAt to 30 days from now for paid plans
    const planExpiresAt = plan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    const user = await prisma.user.update({
      where: { id: BigInt(req.params.id) },
      data: { plan, planExpiresAt },
      select: { id: true, name: true, email: true, plan: true, planExpiresAt: true },
    });
    logger.info(`[Admin] User ${user.email} plan updated to '${plan}'`);
    res.json({ message: `Plan updated to '${plan}' successfully`, user: { ...user, id: user.id.toString() } });
  } catch (err) { next(err); }
}

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
async function deleteUser(req, res, next) {
  try {
    const userId = BigInt(req.params.id);

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete in order (cascade-safe)
    await prisma.$transaction(async (tx) => {
      // Delete token usage
      await tx.tokenUsage.deleteMany({ where: { userId } });
      // Delete refresh tokens
      await tx.refreshToken.deleteMany({ where: { userId } });
      // Delete interview QAs via sessions
      const sessions = await tx.interviewSession.findMany({ where: { userId }, select: { id: true } });
      for (const s of sessions) {
        await tx.interviewQA.deleteMany({ where: { sessionId: s.id } });
      }
      await tx.interviewSession.deleteMany({ where: { userId } });
      // Delete built resumes
      await tx.builtResume.deleteMany({ where: { userId } });
      // Delete resumes (analysis results cascade via relation)
      const resumes = await tx.resume.findMany({ where: { userId }, select: { id: true } });
      for (const r of resumes) {
        await tx.analysisResult.deleteMany({ where: { resumeId: r.id } });
        await tx.resume_sections.deleteMany({ where: { resume_id: r.id } });
      }
      await tx.resume.deleteMany({ where: { userId } });
      // Finally delete user
      await tx.user.delete({ where: { id: userId } });
    });

    logger.info(`[Admin] User ${user.email} (ID: ${user.id}) permanently deleted`);
    res.json({ message: `User '${user.name}' deleted successfully` });
  } catch (err) { next(err); }
}

module.exports = { login, forgotPassword, verifyOtp, resetPassword, getStats, getUsers, getUserDetail, getTokenUsage, updateUserPlan, deleteUser };
