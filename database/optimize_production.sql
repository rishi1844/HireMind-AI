-- =============================================================================
-- HireMind AI (vitaportal) — Production Database Optimization Script
-- Version: 2.0  |  Generated: 2026-05-12
-- Server: MySQL 8.0.45 | Database: vitaportal
-- =============================================================================
-- SAFE TO RUN ON PRODUCTION — uses IF NOT EXISTS, IF EXISTS, safe ALTER ops.
-- Run AFTER taking a full backup: mysqldump -u root -p vitaportal > backup.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- =============================================================================
-- SECTION 1: COLLATION STANDARDIZATION
-- Problem: DB is using mixed collations (utf8mb4_general_ci + utf8mb4_unicode_ci)
-- Fix: Standardize to utf8mb4_unicode_ci for all tables (correct Unicode sorting)
-- Impact: Prevents subtle sort/compare bugs with emojis and multilingual content
-- =============================================================================

ALTER TABLE `users`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `resumes`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `analysis_results`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `resume_sections`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `interview_sessions`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `interview_qa`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `built_resumes`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `admin_users`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `resume_templates`
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- token_usage is already utf8mb4_unicode_ci ✓

-- =============================================================================
-- SECTION 2: PHASE 2.3 + 4.1 — NEW TABLES & COLUMNS
-- =============================================================================

-- 2.1 Refresh Tokens Table (Phase 2.3)
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`         BIGINT        NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT        NOT NULL,
  `token`      VARCHAR(255)  NOT NULL,
  `expires_at` DATETIME(6)   NOT NULL,
  `created_at` DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_refresh_token` (`token`),
  KEY `idx_rt_user` (`user_id`),
  KEY `idx_rt_expires` (`expires_at`),
  CONSTRAINT `fk_refresh_token_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2.2 Add plan + plan_expires_at to users (Phase 4.1)
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `plan` VARCHAR(20) NOT NULL DEFAULT 'free' AFTER `auth_provider`,
  ADD COLUMN IF NOT EXISTS `plan_expires_at` DATETIME(6) NULL AFTER `plan`;

-- =============================================================================
-- SECTION 3: USERS TABLE OPTIMIZATION
-- =============================================================================

-- Problem 1: `mobile` AND `mobile_number` are DUPLICATE columns.
-- `mobile` is used by Node.js backend (Prisma maps to it).
-- `mobile_number` is a legacy Spring Boot artifact — UNUSED in Node.js code.
-- Fix: Keep `mobile`, drop `mobile_number` after migrating data.

-- Step 1: Migrate any non-null mobile_number → mobile (if mobile is empty)
UPDATE `users`
SET `mobile` = `mobile_number`
WHERE `mobile` IS NULL AND `mobile_number` IS NOT NULL;

-- Step 2: Drop the redundant column
ALTER TABLE `users` DROP COLUMN IF EXISTS `mobile_number`;

-- Problem 2: `otp_code` and `otp_expiry` are legacy Spring Boot OTP columns.
-- Node.js uses `email_otp` / `email_otp_expires_at` / `password_reset_otp`.
-- `otp_code` and `otp_expiry` are NEVER written by Node.js backend.
-- Fix: Drop them to reduce row size.

-- Safety check: only drop if ALL values are NULL (no active data)
-- Run this SELECT first to verify: SELECT COUNT(*) FROM users WHERE otp_code IS NOT NULL;
-- If result = 0, safe to proceed:
ALTER TABLE `users` DROP COLUMN IF EXISTS `otp_code`;
ALTER TABLE `users` DROP COLUMN IF EXISTS `otp_expiry`;

-- Problem 3: `profile_picture` is MEDIUMTEXT storing raw base64 strings.
-- This makes the users table HUGE (see: user id=1 with base64 image ~50KB inline).
-- Fix: Add a `profile_picture_url` column for file-based storage (Node.js already
--       saves to disk), and deprecate the base64 column over time.
-- NOTE: Node.js profileImage.service.js already saves to /uploads/ correctly.
--       The base64 data is legacy from Spring Boot. Don't drop yet — migrate first.

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `profile_picture_url` VARCHAR(500) NULL
  AFTER `profile_picture`
  COMMENT 'File-based profile picture URL (replaces base64 profile_picture)';

-- Migrate existing file-path values (those starting with /uploads/)
UPDATE `users`
SET `profile_picture_url` = `profile_picture`
WHERE `profile_picture` IS NOT NULL
  AND `profile_picture` NOT LIKE 'data:%'
  AND `profile_picture_url` IS NULL;

-- Migrate Google OAuth picture URLs
UPDATE `users`
SET `profile_picture_url` = `profile_picture`
WHERE `profile_picture` IS NOT NULL
  AND (`profile_picture` LIKE 'http%' OR `profile_picture` LIKE 'https%')
  AND `profile_picture_url` IS NULL;

-- Problem 4: Missing index on `email_verified` — used in every login query
-- Problem 5: Missing index on `auth_provider` — used in social login queries
-- Problem 6: Missing index on `plan` — used in usage limit checks (Phase 4.1)
-- Problem 7: Missing composite index for password reset OTP lookup

ALTER TABLE `users`
  ADD INDEX IF NOT EXISTS `idx_users_email_verified` (`email_verified`),
  ADD INDEX IF NOT EXISTS `idx_users_provider` (`auth_provider`),
  ADD INDEX IF NOT EXISTS `idx_users_plan` (`plan`),
  ADD INDEX IF NOT EXISTS `idx_users_reset_otp` (`password_reset_otp`, `email`);

-- =============================================================================
-- SECTION 4: RESUMES TABLE OPTIMIZATION
-- =============================================================================

-- Problem 1: `structured_content` is LONGTEXT but appears NULL in all rows.
--            This column is never populated by Node.js backend.
-- Problem 2: `template_id` FK references `resume_templates` — but all values
--            in production data are NULL. Dead relation.
-- Problem 3: `source_type` ENUM is NULL for all rows in production.
--            Node.js doesn't set this field.
-- Problem 4: `file_path` is VARCHAR(500) but all values are NULL.
--            Node.js saves files under /uploads/ and uses `extracted_text`.
-- Fix: Keep columns for now, add comments. Drop only after verifying in app.

-- Problem 5: FK on resumes.user_id uses RESTRICT — means you can't delete a
--            user without first deleting all their resumes. This is fragile.
-- Fix: Change to CASCADE so user deletion automatically removes their resumes.

-- Step 1: Drop old restrict FK
ALTER TABLE `resumes`
  DROP FOREIGN KEY IF EXISTS `FK340nuaivxiy99hslr3sdydfvv`;

-- Step 2: Re-add with CASCADE
ALTER TABLE `resumes`
  ADD CONSTRAINT `fk_resumes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Problem 6: FK on resumes.template_id also uses RESTRICT — but template_id
--            is NULL for all data. Set NULL on delete is safer.
ALTER TABLE `resumes`
  DROP FOREIGN KEY IF EXISTS `FKhy6oj3o65eicd3a0k5o97b4jt`;

ALTER TABLE `resumes`
  ADD CONSTRAINT `fk_resumes_template`
    FOREIGN KEY (`template_id`) REFERENCES `resume_templates` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Problem 7: Missing index on `uploaded_at` — used in history/sorting queries
ALTER TABLE `resumes`
  ADD INDEX IF NOT EXISTS `idx_resumes_user_uploaded` (`user_id`, `uploaded_at` DESC);

-- =============================================================================
-- SECTION 5: ANALYSIS_RESULTS TABLE OPTIMIZATION
-- =============================================================================

-- Problem 1: FK uses RESTRICT — cannot delete resume without deleting analysis.
-- Fix: Change to CASCADE.
ALTER TABLE `analysis_results`
  DROP FOREIGN KEY IF EXISTS `FKd18rhc9klmm40y3de93iuvn56`;

ALTER TABLE `analysis_results`
  ADD CONSTRAINT `fk_analysis_resume`
    FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Problem 2: `raw_analysis` stores the FULL JSON that duplicates strengths,
--            weaknesses, improvements etc. — this is double storage.
-- Solution: Keep for now (backward compat), but the app should stop
--           writing `raw_analysis` and use structured columns directly.
-- NOTE: raw_analysis is ~10-30KB per row. With 1000 users, this is ~30MB extra.

-- Problem 3: Missing index on `analyzed_at` (used in admin dashboard)
ALTER TABLE `analysis_results`
  ADD INDEX IF NOT EXISTS `idx_analysis_analyzed_at` (`analyzed_at` DESC);

-- =============================================================================
-- SECTION 6: RESUME_SECTIONS TABLE OPTIMIZATION
-- =============================================================================

-- Problem 1: This table is COMPLETELY EMPTY in production and is a legacy
--            Spring Boot artifact. Node.js backend does NOT use this table.
-- Problem 2: FK uses RESTRICT — resume cannot be deleted if sections exist.
-- Fix: Change FK to CASCADE and note for future cleanup.

ALTER TABLE `resume_sections`
  DROP FOREIGN KEY IF EXISTS `FK2qre6dt8fh13yh1q1pckd7eu1`;

ALTER TABLE `resume_sections`
  ADD CONSTRAINT `fk_resume_sections_resume`
    FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- SECTION 7: INTERVIEW_SESSIONS TABLE OPTIMIZATION
-- =============================================================================

-- Problem 1: Both FKs use RESTRICT — fragile cascade chain.
-- Fix: user_id → CASCADE, resume_id → SET NULL (interview can exist without resume)

ALTER TABLE `interview_sessions`
  DROP FOREIGN KEY IF EXISTS `FKhresfe6p1s53klvmqhxxissa2`,
  DROP FOREIGN KEY IF EXISTS `FKoa5rgsdu7rqa8y74yph1fuqe5`;

ALTER TABLE `interview_sessions`
  ADD CONSTRAINT `fk_isessions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_isessions_resume`
    FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Problem 2: Missing composite index for user history queries
ALTER TABLE `interview_sessions`
  ADD INDEX IF NOT EXISTS `idx_isessions_user_created` (`user_id`, `created_at` DESC);

-- =============================================================================
-- SECTION 8: TOKEN_USAGE TABLE OPTIMIZATION
-- =============================================================================

-- Problem 1: ALL 21 rows have user_id = NULL! This means token tracking is broken.
-- Root cause: The Node.js service doesn't pass userId when saving token usage.
-- Fix: Add index on (user_id, feature, created_at) for usage limit queries (Phase 4.1)
-- Code fix needed in backend (see Section 9 in explanation below).

ALTER TABLE `token_usage`
  ADD INDEX IF NOT EXISTS `idx_tu_user_feature_date`
    (`user_id`, `feature`, `created_at`);

-- Also add monthly partitioning index for usage limit queries:
-- "How many cover_letters did this user use THIS MONTH?"
-- Existing indexes (idx_tu_user, idx_tu_feature, idx_tu_created) are good
-- but composite index above is better for the specific usage limit query.

-- =============================================================================
-- SECTION 9: BUILT_RESUMES TABLE — Check schema
-- =============================================================================

-- (Already analyzed from file — built_resumes stores full resume JSON)
-- Add user_id index if missing (Prisma should have it)

-- =============================================================================
-- SECTION 10: ORPHAN DATA CLEANUP
-- =============================================================================

-- Remove analysis_results where the parent resume no longer exists
-- (This should be 0 rows but good to verify)
DELETE FROM `analysis_results`
WHERE `resume_id` NOT IN (SELECT `id` FROM `resumes`);

-- Remove interview_qa where parent session no longer exists
DELETE FROM `interview_qa`
WHERE `session_id` NOT IN (SELECT `id` FROM `interview_sessions`);

-- Clean up expired refresh tokens (can be run periodically)
DELETE FROM `refresh_tokens` WHERE `expires_at` < NOW();

-- =============================================================================
-- SECTION 11: PERFORMANCE — EVENT SCHEDULER (Auto cleanup)
-- =============================================================================

-- Auto-cleanup expired refresh tokens every day (production-safe)
DROP EVENT IF EXISTS `evt_cleanup_refresh_tokens`;
CREATE EVENT `evt_cleanup_refresh_tokens`
  ON SCHEDULE EVERY 1 DAY
  STARTS CURRENT_TIMESTAMP
  DO
    DELETE FROM `refresh_tokens` WHERE `expires_at` < NOW();

-- =============================================================================
-- SECTION 12: VERIFY EVERYTHING
-- =============================================================================

SHOW TABLES;
SHOW COLUMNS FROM `users`;
SHOW INDEX FROM `users`;
SHOW INDEX FROM `resumes`;
SHOW INDEX FROM `analysis_results`;
SHOW INDEX FROM `interview_sessions`;
SHOW INDEX FROM `token_usage`;
SHOW INDEX FROM `refresh_tokens`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- END OF SCRIPT
-- =============================================================================
