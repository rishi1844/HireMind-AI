// src/services/auth.service.js — Full port of Spring AuthService.java
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/db');
const { generateToken } = require('../utils/jwt.utils');
const { generateOtp, expiresAt, isExpired } = require('../utils/otp.utils');
const { normalizeEmail, trimToNull, hasText, fallbackNameFromEmail } = require('../utils/sanitize.utils');
const authEmailService = require('./authEmail.service');
const smsService = require('./sms.service');
const logger = require('../utils/logger');

const _googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const EMAIL_OTP_EXPIRY_MINUTES = 10;
const PASSWORD_RESET_OTP_EXPIRY_MINUTES = 10;

// ─── Register ─────────────────────────────────────────────────────────────────
async function register(body) {
  const email = normalizeEmail(body.email);
  const name = normalizeName(body.name);
  const mobile = trimToNull(body.mobile);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.emailVerified || !existing.emailOtp) {
      const err = new Error('Email already in use: ' + email);
      err.status = 409;
      throw err;
    }
    // Unverified account — resend OTP
    const otp = generateOtp();
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        name,
        password: await bcrypt.hash(body.password, 12),
        mobile,
        provider: 'local',
        emailOtp: otp,
        emailOtpExpiresAt: expiresAt(EMAIL_OTP_EXPIRY_MINUTES),
        emailVerified: false,
        updatedAt: new Date(),
      },
    });
    await authEmailService.sendVerificationOtp(updatedUser, otp, EMAIL_OTP_EXPIRY_MINUTES);
    return {
      message: 'Account already exists but still needs verification. A fresh OTP has been sent.',
      requiresVerification: true,
      email,
    };
  }

  const otp = generateOtp();
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(body.password, 12),
      mobile,
      provider: 'local',
      emailVerified: false,
      emailOtp: otp,
      emailOtpExpiresAt: expiresAt(EMAIL_OTP_EXPIRY_MINUTES),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await authEmailService.sendVerificationOtp(user, otp, EMAIL_OTP_EXPIRY_MINUTES);
  return {
    message: 'Account created. Verify your email to continue.',
    requiresVerification: true,
    email,
  };
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function login(body) {
  const email = normalizeEmail(body.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  // Block unverified local accounts — no bypass allowed
  if (user.provider === 'local' && !user.emailVerified) {
    const err = new Error('Please verify your email before logging in. Check your inbox for the OTP.');
    err.status = 403;
    throw err;
  }

  const passwordMatch = await bcrypt.compare(body.password, user.password);
  if (!passwordMatch) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const token = generateToken(user.email);
  // Generate refresh token (fire-and-forget — don't break login if RT creation fails)
  let refreshToken = null;
  try { refreshToken = await generateRefreshToken(user.id); } catch (e) { logger.warn('[Auth] RT gen failed: ' + e.message); }
  return toAuthResponse(user, token, refreshToken);
}


// ─── Verify OTP ───────────────────────────────────────────────────────────────
async function verifyOtp(body) {
  const email = normalizeEmail(body.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  validateOtp(body.otp, user.emailOtp, user.emailOtpExpiresAt, 'Invalid verification OTP', 'Verification OTP has expired');

  const updated = await prisma.user.update({
    where: { email },
    data: { emailVerified: true, emailOtp: null, emailOtpExpiresAt: null, updatedAt: new Date() },
  });

  // Send welcome email after first-time email verification (fire & forget)
  authEmailService.sendWelcomeEmail(updated).catch(e => logger.warn('[Auth] Welcome email failed: ' + e.message));

  let rt = null;
  try { rt = await generateRefreshToken(updated.id); } catch (e) { logger.warn('[Auth] RT gen failed on verifyOtp: ' + e.message); }
  return toAuthResponse(updated, generateToken(updated.email), rt);
}

// ─── Resend OTP ───────────────────────────────────────────────────────────────
async function resendOtp(body) {
  const email = normalizeEmail(body.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  if (user.emailVerified) {
    return { message: 'Email is already verified.', requiresVerification: false, email };
  }

  const otp = generateOtp();
  const updated = await prisma.user.update({
    where: { email },
    data: { emailOtp: otp, emailOtpExpiresAt: expiresAt(EMAIL_OTP_EXPIRY_MINUTES), updatedAt: new Date() },
  });
  await authEmailService.sendVerificationOtp(updated, otp, EMAIL_OTP_EXPIRY_MINUTES);
  return { message: 'A new verification code has been sent.', requiresVerification: true, email };
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
async function forgotPassword(body) {
  const email = normalizeEmail(body.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  const otp = generateOtp();
  const updated = await prisma.user.update({
    where: { email },
    data: { passwordResetOtp: otp, passwordResetOtpExpiresAt: expiresAt(PASSWORD_RESET_OTP_EXPIRY_MINUTES), updatedAt: new Date() },
  });
  await authEmailService.sendPasswordResetOtp(updated, otp, PASSWORD_RESET_OTP_EXPIRY_MINUTES);
  return { message: 'Password reset OTP sent to your email.', requiresVerification: false, email };
}

// ─── Reset Password ───────────────────────────────────────────────────────────
// Accepts: { email, otp, password }
async function resetPassword(body) {
  const email = normalizeEmail(body.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  validateOtp(body.otp, user.passwordResetOtp, user.passwordResetOtpExpiresAt, 'Invalid reset OTP', 'Reset OTP has expired');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(body.password, 12),
      passwordResetOtp: null,
      passwordResetOtpExpiresAt: null,
      emailVerified: user.provider === 'local' ? true : user.emailVerified,
      updatedAt: new Date(),
    },
  });
  return toAuthResponse(updated, generateToken(updated.email));
}


// ─── Social Login ─────────────────────────────────────────────────────────────
async function socialLogin(body) {
  const provider = trimToNull(body.provider);
  if (!provider) throw new Error('Social provider is required.');

  if (provider.toLowerCase() === 'google') {
    return handleGoogleLogin(body.token);
  }
  if (provider.toLowerCase() === 'linkedin') {
    throw new Error('LinkedIn login is not configured on the backend yet.');
  }
  throw new Error('Unsupported social login provider: ' + provider);
}

async function handleGoogleLogin(credentialToken) {
  if (!hasText(credentialToken)) throw new Error('Google token is required.');

  let email, name, picture;
  try {
    const ticket = await _googleClient.verifyIdToken({
      idToken: credentialToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const claims = ticket.getPayload();
    if (!claims) throw new Error('Empty Google token payload.');
    if (!claims.email_verified) throw new Error('Google account email is not verified.');
    email = claims.email ? normalizeEmail(claims.email) : null;
    name = trimToNull(claims.name);
    picture = trimToNull(claims.picture);
  } catch (err) {
    logger.warn('[Auth] Google token verification failed: ' + err.message);
    const e = new Error('Google sign-in failed. Invalid or expired token.');
    e.status = 401;
    throw e;
  }

  if (!email) throw new Error('Google account email is missing.');

  const existingUser = await prisma.user.findUnique({ where: { email } });
  const userData = {
    name: hasText(name) ? name : fallbackNameFromEmail(email),
    profilePicture: picture || (existingUser ? existingUser.profilePicture : null),
    provider: 'google',
    emailVerified: true,
    emailOtp: null,
    emailOtpExpiresAt: null,
    updatedAt: new Date(),
  };

  let user;
  if (existingUser) {
    user = await prisma.user.update({ where: { email }, data: userData });
  } else {
    user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(require('crypto').randomUUID(), 12),
        createdAt: new Date(),
        ...userData,
      },
    });
  }

  let rt = null;
  try { rt = await generateRefreshToken(user.id); } catch (e) { logger.warn('[Auth] RT gen failed on socialLogin: ' + e.message); }
  return toAuthResponse(user, generateToken(user.email), rt);
}

// ─── Get Current User ──────────────────────────────────────────────────────────
async function getCurrentUser(email) {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) throw new Error('User not found');
  return toUserResponse(user);
}

// ─── Update Profile ───────────────────────────────────────────────────────────
async function updateProfile(email, body) {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) throw new Error('User not found');

  const updated = await prisma.user.update({
    where: { email: user.email },
    data: {
      name: normalizeName(body.name),
      mobile: trimToNull(body.mobile),
      headline: trimToNull(body.headline),
      bio: trimToNull(body.bio),
      profilePicture: trimToNull(body.profilePicture),
      updatedAt: new Date(),
    },
  });
  return toUserResponse(updated);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function validateOtp(provided, actual, expiryDate, invalidMsg, expiredMsg) {
  if (!actual || actual !== provided) throw new Error(invalidMsg);
  if (isExpired(expiryDate)) throw new Error(expiredMsg);
}

// parseJwtPayload kept for any future use but Google login no longer uses it
function parseJwtPayload(token) {
  const parts = token.split('.');
  if (parts.length < 2) throw new Error('Invalid token format.');
  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch {
    throw new Error('Unable to read token payload.');
  }
}

function isGoogleIssuerValid(issuer) {
  return issuer === 'accounts.google.com' || issuer === 'https://accounts.google.com';
}

function normalizeName(name) {
  const n = trimToNull(name);
  if (!n) throw new Error('Name is required');
  return n;
}

// ─── maskEmail helper ────────────────────────────────────────────────────────
function maskEmail(email) {
  const [local, domain] = email.split('@');
  const visible = local.substring(0, Math.min(2, local.length));
  return `${visible}****@${domain}`;
}

function toAuthResponse(user, token, refreshToken = null) {
  return {
    token,
    refreshToken,
    type: 'Bearer',
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    provider: user.provider || 'local',
    emailVerified: user.emailVerified,
    mobile: user.mobile,
    profilePicture: user.profilePicture,
    headline: user.headline,
    bio: user.bio,
    plan: user.plan || 'free',
    planExpiresAt: user.planExpiresAt,
  };
}


function toUserResponse(user) {
  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    provider: user.provider || 'local',
    emailVerified: user.emailVerified,
    mobile: user.mobile,
    profilePicture: user.profilePicture,
    headline: user.headline,
    bio: user.bio,
    plan: user.plan || 'free',
    planExpiresAt: user.planExpiresAt,
    createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
  };
}

// ─── Change Password (logged-in user) ────────────────────────────────────────
async function changePassword(email, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    const err = new Error('Current password and new password are required.');
    err.status = 400;
    throw err;
  }
  if (newPassword.length < 6) {
    const err = new Error('New password must be at least 6 characters.');
    err.status = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('User not found.'); err.status = 404; throw err;
  }
  if (user.provider !== 'local') {
    const err = new Error('Password change is not available for social login accounts.');
    err.status = 400;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const err = new Error('Current password is incorrect.');
    err.status = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { password: hashed, updatedAt: new Date() } });

  // Revoke all refresh tokens so other sessions are logged out
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  logger.info('[Auth] Password changed for ' + email);
  return { message: 'Password changed successfully. Please log in again on other devices.' };
}

// ─── Delete Account ───────────────────────────────────────────────────────────
async function deleteAccount(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error('User not found.'); err.status = 404; throw err;
  }

  // For local accounts: require password confirmation
  if (user.provider === 'local') {
    if (!password) {
      const err = new Error('Password confirmation is required to delete your account.');
      err.status = 400;
      throw err;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Incorrect password. Account not deleted.');
      err.status = 400;
      throw err;
    }
  }

  // Cascade delete all user data
  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.deleteMany({ where: { userId: user.id } });
    await tx.tokenUsage.deleteMany({ where: { userId: user.id } });

    // Interview QAs via sessions
    const sessions = await tx.interviewSession.findMany({ where: { userId: user.id }, select: { id: true } });
    if (sessions.length) {
      await tx.interviewQA.deleteMany({ where: { sessionId: { in: sessions.map(s => s.id) } } });
      await tx.interviewSession.deleteMany({ where: { userId: user.id } });
    }

    // Resume sections + analysis via resumes
    const resumes = await tx.resume.findMany({ where: { userId: user.id }, select: { id: true } });
    if (resumes.length) {
      const resumeIds = resumes.map(r => r.id);
      await tx.resume_sections.deleteMany({ where: { resume_id: { in: resumeIds } } });
      await tx.analysisResult.deleteMany({ where: { resumeId: { in: resumeIds } } });
      await tx.resume.deleteMany({ where: { userId: user.id } });
    }

    await tx.builtResume.deleteMany({ where: { userId: user.id } });
    await tx.user.delete({ where: { id: user.id } });
  });

  logger.info('[Auth] Account deleted for ' + email);
  return { message: 'Your account and all associated data have been permanently deleted.' };
}

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  socialLogin,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount,
  generateRefreshToken,
  refreshAccessToken,
};

// ─── Refresh Token (Phase 2.3) ────────────────────────────────────────────────
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

async function generateRefreshToken(userId) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Clean up old expired tokens for this user (keep DB tidy)
  await prisma.refreshToken.deleteMany({
    where: { userId: BigInt(userId), expiresAt: { lt: new Date() } },
  });

  await prisma.refreshToken.create({
    data: {
      userId: BigInt(userId),
      token,
      expiresAt: expiry,
    },
  });

  return token;
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    const err = new Error('Refresh token is required.');
    err.status = 400;
    throw err;
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored) {
    const err = new Error('Invalid refresh token.');
    err.status = 401;
    throw err;
  }
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const err = new Error('Refresh token has expired. Please log in again.');
    err.status = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    const err = new Error('User not found.');
    err.status = 401;
    throw err;
  }

  const newAccessToken = generateToken(user.email);
  // Issue a fresh refresh token and revoke old one
  const newRefreshToken = await generateRefreshToken(user.id);
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  logger.info(`[Auth] Refresh token rotated for ${user.email}`);

  return {
    token: newAccessToken,
    refreshToken: newRefreshToken,
    type: 'Bearer',
    email: user.email,
    name: user.name,
  };
}

