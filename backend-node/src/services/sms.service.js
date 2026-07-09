// src/services/sms.service.js — Twilio SMS (replaces SmsService.java)
const logger = require('../utils/logger');

/**
 * Send an OTP via SMS using Twilio.
 * Mirrors SmsService.sendOtp()
 */
async function sendOtp(to, otp, expiresInMinutes) {
  const smsEnabled = process.env.SMS_ENABLED === 'true';

  if (!smsEnabled) {
    throw new Error(
      'SMS sending is not configured. Set SMS_ENABLED=true and provide Twilio credentials.'
    );
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      'Twilio SMS configuration is missing. Provide TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.'
    );
  }

  // Lazy-require twilio only when actually needed
  const twilio = require('twilio');
  const client = twilio(accountSid, authToken);

  const body = `Your verification code is ${otp} and expires in ${expiresInMinutes} minutes.`;

  const message = await client.messages.create({
    to,
    from: fromNumber,
    body,
  });

  logger.info(`Sent SMS to ${to} with sid=${message.sid}`);
}

module.exports = { sendOtp };
