// src/services/authEmail.service.js
// Replaces Spring AuthEmailService.java — sends OTP emails via Nodemailer
const path = require('path');
const { getTransporter } = require('../config/email');
const logger = require('../utils/logger');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://vita.genixpay.com').split(',')[0].trim();
const PRICING_URL = `${FRONTEND_URL}/pricing`;

/**
 * Send email OTP for account verification.
 */
async function sendVerificationOtp(user, otp, expiresInMinutes) {
  const subject = 'Verify your email address — Vita AI';
  const body = buildOtpEmailBody(user.name, otp, expiresInMinutes, 'Use the code below to activate your account.');
  await sendEmail(user.email, subject, body, otp);
}

/**
 * Send password reset OTP.
 */
async function sendPasswordResetOtp(user, otp, expiresInMinutes) {
  const subject = 'Password reset code — Vita AI';
  const body = buildOtpEmailBody(user.name, otp, expiresInMinutes, 'Use this code to reset your password.');
  await sendEmail(user.email, subject, body, otp);
}

/**
 * Send admin password reset OTP.
 * Same OTP email template, sent to admin email.
 */
async function sendAdminPasswordResetOtp(adminEmail, otp, expiresInMinutes) {
  const subject = 'Admin Password Reset — Vita AI';
  const body = buildOtpEmailBody('Admin', otp, expiresInMinutes, 'Use this code to reset your admin password. Do not share this with anyone.');
  await sendEmail(adminEmail, subject, body, otp);
}

/**
 * Send welcome / greeting email after successful registration.
 */
async function sendWelcomeEmail(user) {
  const subject = 'Welcome to Vita — Your Career Journey Starts Here 🚀';
  const body = buildWelcomeEmailBody(user.name, user.email);
  await sendEmailGeneral(user.email, subject, body);
}

// ─── Core send helpers ────────────────────────────────────────────────────────

async function sendEmail(to, subject, htmlBody, otp) {
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn('╔══════════════════════════════════════════════╗');
    logger.warn('║         [DEV MODE — EMAIL NOT SENT]          ║');
    logger.warn(`║  To: ${to}`);
    logger.warn(`║  OTP Code: ${otp}`);
    logger.warn('║  Cause: MAIL_ENABLED=false or transporter null║');
    logger.warn('╚══════════════════════════════════════════════╝');
    return;
  }

  try {
    logger.info(`Sending OTP email to ${to}...`);
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@vitaigenixpay.gmail.com>`;
    await transporter.sendMail({
      from: `"Vita AI Platform" <${process.env.MAIL_USERNAME}>`,
      replyTo: process.env.MAIL_USERNAME,
      to,
      subject,
      html: htmlBody,
      attachments: [{
        filename: 'logo.png',
        path: path.join(__dirname, '../assets/logo.png'),
        cid: 'logo'
      }],
      headers: {
        'Message-ID': messageId,
        'X-Mailer': 'Vita-AI-Mailer/1.0',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High',
      },
    });
    logger.info(`✓ OTP email sent successfully to ${to}`);
  } catch (err) {
    logger.error(`✗ Failed to send OTP email to ${to}: ${err.message}`);
    throw new Error(`Failed to send email: ${err.message}`);
  }
}

async function sendEmailGeneral(to, subject, htmlBody) {
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn(`[DEV MODE] Email not sent — MAIL_ENABLED=false. To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    logger.info(`Sending email to ${to} — "${subject}"...`);
    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@vitaigenixpay.gmail.com>`;
    await transporter.sendMail({
      from: `"Vita" <${process.env.MAIL_USERNAME}>`,
      replyTo: process.env.MAIL_USERNAME,
      to,
      subject,
      html: htmlBody,
      attachments: [{
        filename: 'logo.png',
        path: path.join(__dirname, '../assets/logo.png'),
        cid: 'logo'
      }],
      headers: { 'Message-ID': messageId, 'X-Mailer': 'Vita-AI-Mailer/1.0' },
    });
    logger.info(`✓ Email sent to ${to}`);
  } catch (err) {
    logger.error(`✗ Failed to send email to ${to}: ${err.message}`);
    // Welcome email failure should NOT block registration — fire & forget
  }
}

// ─── HTML builders ────────────────────────────────────────────────────────────

function buildOtpEmailBody(name, otp, expiresInMinutes, subtitle) {
  const displayName = name && name.trim() ? name : 'there';
  const escapedName = escapeHtml(displayName);
  const escapedOtp = escapeHtml(otp);

  return `<html>
<body style="font-family: 'Inter', Arial, sans-serif; background: #0f172a; padding: 32px;">
<div style="max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 20px; padding: 36px; border: 1px solid #334155;">
  <div style="margin-bottom: 24px; line-height: 36px;">
    <div style="background: linear-gradient(180deg, #1e293b, #0f172a); border-radius: 10px; padding: 4px; border: 1px solid #334155; display: inline-block; vertical-align: middle;">
      <img src="cid:logo" alt="Vita Logo" width="24" height="24" style="display: block; border-radius: 6px; object-fit: contain;" />
    </div>
    <span style="font-size: 24px; font-weight: 800; color: #a78bfa; display: inline-block; vertical-align: middle; margin-left: 10px;">Vita AI</span>
  </div>
  <h2 style="color: #f1f5f9; margin: 0 0 8px;">Hello ${escapedName},</h2>
  <p style="color: #94a3b8; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">${subtitle}</p>
  <div style="background: #0f172a; border: 1px solid #475569; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px;">
    <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">Your verification code</p>
    <p style="font-size: 36px; letter-spacing: 0.3em; margin: 0; font-weight: 700; color: #a78bfa;">${escapedOtp}</p>
  </div>
  <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">This code expires in <strong style="color:#94a3b8">${expiresInMinutes} minutes</strong>.</p>
  <p style="color: #475569; font-size: 12px; margin: 0;">If you did not request this code, please ignore this email.</p>
</div>
</body>
</html>`;
}

function buildWelcomeEmailBody(name, email) {
  const firstName = (name && name.trim()) ? name.trim().split(' ')[0] : 'there';
  const escapedName = escapeHtml(firstName);
  const escapedEmail = escapeHtml(email || '');
  const resumeUrl = `${FRONTEND_URL}/dashboard`;
  const pricingUrl = PRICING_URL;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to Vita</title></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f172a;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:24px;overflow:hidden;border:1px solid #1e293b;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e0a3c 0%,#1a1040 40%,#0d1a3a 100%);padding:40px 40px 32px;text-align:center;border-bottom:1px solid #2d1b69;">
              <div style="display:inline-block;background:linear-gradient(180deg,#1e293b,#0f172a);border-radius:16px;padding:6px;border:1px solid #334155;margin-bottom:20px;box-shadow:0 4px 20px #2d1b69;">
                <img src="cid:logo" alt="Vita Logo" width="44" height="44" style="display:block;border-radius:10px;object-fit:contain;" />
              </div>
              <h1 style="margin:0;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Vita</h1>
              <p style="margin:6px 0 0;font-size:13px;color:#8b7fc7;letter-spacing:0.08em;text-transform:uppercase;font-weight:500;">AI-Powered Career Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#111827;padding:40px;">

              <!-- Greeting -->
              <h2 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#f1f5f9;line-height:1.3;">
                Hey ${escapedName}, welcome aboard! 🎉
              </h2>
              <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.8;">
                You've just joined thousands of job seekers who use <strong style="color:#a78bfa;">Vita</strong> to build stunning resumes,
                beat ATS filters, and ace mock interviews — all powered by cutting-edge AI.
                Your career upgrade starts right now.
              </p>

              <!-- Feature highlights -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#1e293b;border-radius:16px;padding:28px;border:1px solid #334155;">
                    <p style="margin:0 0 20px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.1em;">Here's what you can do with Vita:</p>

                    <!-- Feature 1 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed22,#4f46e522);border-radius:10px;border:1px solid #7c3aed44;text-align:center;line-height:36px;font-size:18px;">📄</div>
                        </td>
                        <td style="padding-left:14px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">AI Resume Builder</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Generate polished, ATS-ready resumes tailored to any job description in minutes.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Feature 2 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width:36px;height:36px;background:linear-gradient(135deg,#0891b222,#06b6d422);border-radius:10px;border:1px solid #0891b244;text-align:center;line-height:36px;font-size:18px;">🎯</div>
                        </td>
                        <td style="padding-left:14px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">ATS Score Checker</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Upload your resume and instantly see how well it passes Applicant Tracking Systems.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Feature 3 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width:36px;height:36px;background:linear-gradient(135deg,#05966922,#10b98122);border-radius:10px;border:1px solid #05966944;text-align:center;line-height:36px;font-size:18px;">🎤</div>
                        </td>
                        <td style="padding-left:14px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">AI Mock Interviews</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Practice real interview questions with AI feedback to boost your confidence.</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Feature 4 -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="40" valign="top">
                          <div style="width:36px;height:36px;background:linear-gradient(135deg,#d9770622,#f5963722);border-radius:10px;border:1px solid #d9770644;text-align:center;line-height:36px;font-size:18px;">✉️</div>
                        </td>
                        <td style="padding-left:14px;vertical-align:middle;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#e2e8f0;">AI Cover Letters</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Generate compelling, personalized cover letters for every application in seconds.</p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${resumeUrl}" target="_blank"
                       style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;padding:14px 36px;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(124,58,237,0.35);">
                      Build Your Resume Now →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="border-top:1px solid #1e293b;"></td>
                </tr>
              </table>

              <!-- Pro upsell (soft) -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e0a3c,#1a1040);border-radius:14px;padding:24px;border:1px solid #2d1b6944;text-align:center;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.12em;">✦ Pro Plan</p>
                    <p style="margin:0 0 14px;font-size:15px;font-weight:600;color:#e2e8f0;">Want unlimited access?</p>
                    <p style="margin:0 0 18px;font-size:13px;color:#8b7fc7;line-height:1.6;">Unlock unlimited resume analyses, ATS checks, mock interviews, and priority AI responses with our Pro plan.</p>
                    <a href="${pricingUrl}" target="_blank"
                       style="display:inline-block;background:transparent;color:#a78bfa;font-size:13px;font-weight:600;text-decoration:none;border:1px solid #7c3aed66;border-radius:8px;padding:10px 24px;letter-spacing:0.02em;">
                      View Plans
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d1117;padding:28px 40px;text-align:center;border-top:1px solid #1e293b;">
              <p style="margin:0 0 8px;font-size:12px;color:#475569;line-height:1.6;">
                You're receiving this because you signed up with ${escapedEmail}.
              </p>
              <p style="margin:0;font-size:11px;color:#334155;">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function escapeHtml(value) {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

module.exports = { sendVerificationOtp, sendPasswordResetOtp, sendWelcomeEmail, sendAdminPasswordResetOtp };
