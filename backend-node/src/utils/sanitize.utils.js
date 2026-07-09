// src/utils/sanitize.utils.js — String utilities (mirrors AuthService helpers)

/**
 * Trim whitespace. Return null if blank.
 * Mirrors AuthService.trimToNull()
 */
function trimToNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Normalize email: trim + lowercase.
 * Throws if email is missing.
 * Mirrors AuthService.normalizeEmail()
 */
function normalizeEmail(email) {
  const normalized = trimToNull(email);
  if (!normalized) throw new Error('Email is required');
  return normalized.toLowerCase();
}

/**
 * Check if a string has non-blank content.
 * Mirrors AuthService.hasText()
 */
function hasText(value) {
  return value != null && String(value).trim().length > 0;
}

/**
 * Sanitize a filename — keep only alphanumeric, dash, underscore.
 * Mirrors ResumeBuilderController.sanitize()
 */
function sanitizeFilename(title) {
  if (!title) return 'resume';
  return title.replace(/[^a-zA-Z0-9_\-]/g, '_');
}

/**
 * Extract fallback name from email.
 * Mirrors AuthService.fallbackNameFromEmail()
 */
function fallbackNameFromEmail(email) {
  const atIndex = email.indexOf('@');
  const localPart = atIndex > 0 ? email.substring(0, atIndex) : email;
  return localPart.replace(/\./g, ' ').trim();
}

module.exports = {
  trimToNull,
  normalizeEmail,
  hasText,
  sanitizeFilename,
  fallbackNameFromEmail,
};
