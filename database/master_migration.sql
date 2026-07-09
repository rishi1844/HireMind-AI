-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║     HireMind AI (vitaportal) — MASTER PRODUCTION MIGRATION              ║
-- ║     Version: 2.0 | Date: 2026-05-12                                     ║
-- ║     MySQL 8.0.45 | Database: vitaportal                                 ║
-- ╠══════════════════════════════════════════════════════════════════════════╣
-- ║  HOW TO RUN:                                                            ║
-- ║  mysql -u root -p vitaportal < master_migration.sql                     ║
-- ║                                                                         ║
-- ║  ⚠️  TAKE BACKUP FIRST:                                                  ║
-- ║  mysqldump -u root -p vitaportal > vitaportal_backup_$(date +%Y%m%d).sql ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

SELECT '=====================================================' AS '';
SELECT '  STEP 1: COLLATION STANDARDIZATION                  ' AS '';
SELECT '=====================================================' AS '';

-- Standardize ALL tables to utf8mb4_unicode_ci (was mixed general_ci + unicode_ci)
-- This prevents sort/compare bugs with multilingual content and emojis
ALTER TABLE `users`             CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `resumes`           CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `analysis_results`  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `resume_sections`   CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `interview_sessions`CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `interview_qa`      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `built_resumes`     CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `admin_users`       CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `resume_templates`  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- token_usage already utf8mb4_unicode_ci ✓

SELECT 'Step 1 done: Collation standardized' AS '';

-- ─────────────────────────────────────────────────────────────────────────────
SELECT '=====================================================' AS '';
SELECT '  STEP 2: NEW TABLES (Phase 2.3 - Refresh Tokens)   ' AS '';
SELECT '=====================================================' AS '';

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT       NOT NULL,
  `token`      VARCHAR(255) NOT NULL,
  `expires_at` DATETIME(6)  NOT NULL,
  `created_at` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_refresh_token`   (`token`),
  KEY         `idx_rt_user`       (`user_id`),
  KEY         `idx_rt_expires`    (`expires_at`),
  CONSTRAINT  `fk_refresh_token_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Step 2 done: refresh_tokens table created (or already exists)' AS '';

-- ─────────────────────────────────────────────────────────────────────────────
SELECT '=====================================================' AS '';
SELECT '  STEP 3: NEW COLUMNS (Phase 4.1 - Plan & Profile)  ' AS '';
SELECT '=====================================================' AS '';

-- 3.1  plan + plan_expires_at on users (Free vs Pro)
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `plan`             VARCHAR(20)  NOT NULL DEFAULT 'free'
    COMMENT 'User plan: free | pro'
    AFTER `auth_provider`,
  ADD COLUMN IF NOT EXISTS `plan_expires_at`  DATETIME(6)  NULL
    COMMENT 'When Pro plan expires (NULL = never or not Pro)'
    AFTER `plan`;

-- 3.2  profile_picture_url for file-based images (replacing base64 inline storage)
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `profile_picture_url` VARCHAR(500) NULL
    COMMENT 'Disk-based profile picture path or Google/LinkedIn URL'
    AFTER `profile_picture`;

-- Migrate: copy file-path and external URLs into the new column
UPDATE `users`
SET `profile_picture_url` = `profile_picture`
WHERE `profile_picture` IS NOT NULL
  AND `profile_picture` NOT LIKE 'data:%'
  AND `profile_picture_url` IS NULL;

SELECT 'Step 3 done: plan, plan_expires_at, profile_picture_url added' AS '';

-- ─────────────────────────────────────────────────────────────────────────────
SELECT '=====================================================' AS '';
SELECT '  STEP 4: REMOVE DEAD/DUPLICATE COLUMNS (users)     ' AS '';
SELECT '=====================================================' AS '';

-- 4.1  mobile_number is a Spring Boot legacy duplicate of `mobile`.
--      Node.js only reads/writes `mobile`. Migrate data then drop.
UPDATE `users`
SET `mobile` = `mobile_number`
WHERE `mobile` IS NULL
  AND `mobile_number` IS NOT NULL;

ALTER TABLE `users` DROP COLUMN IF EXISTS `mobile_number`;

-- 4.2  otp_code + otp_expiry are Spring Boot OTP columns, NEVER used by Node.js.
--      Node.js uses email_otp / email_otp_expires_at / password_reset_otp instead.
--      Safe to drop (all values are NULL in production).
ALTER TABLE `users` DROP COLUMN IF EXISTS `otp_code`;
ALTER TABLE `users` DROP COLUMN IF EXISTS `otp_expiry`;

SELECT 'Step 4 done: Removed mobile_number, otp_code, otp_expiry' AS '';

-- ─────────────────────────────────────────────────────────────────────────────
SELECT '=====================================================' AS '';
SELECT '  STEP 5: FIX FOREIGN KEY CASCADE RULES             ' AS '';
SELECT '=====================================================' AS '';
-- All FKs were RESTRICT — fragile deletion chain. Fix to CASCADE/SET NULL.

-- 5.1  resumes.user_id → CASCADE (delete user → delete their resumes)
ALTER TABLE `resumes`
  DROP FOREIGN KEY IF EXISTS `FK340nuaivxiy99hslr3sdydfvv`,
  DROP FOREIGN KEY IF EXISTS `fk_resumes_user`;   -- in case re-run

ALTER TABLE `resumes`
  ADD CONSTRAINT `fk_resumes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.2  resumes.template_id → SET NULL (safe if template is removed)
ALTER TABLE `resumes`
  DROP FOREIGN KEY IF EXISTS `FKhy6oj3o65eicd3a0k5o97b4jt`,
  DROP FOREIGN KEY IF EXISTS `fk_resumes_template`;

ALTER TABLE `resumes`
  ADD CONSTRAINT `fk_resumes_template`
    FOREIGN KEY (`template_id`) REFERENCES `resume_templates` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 5.3  analysis_results.resume_id → CASCADE
ALTER TABLE `analysis_results`
  DROP FOREIGN KEY IF EXISTS `FKd18rhc9klmm40y3de93iuvn56`,
  DROP FOREIGN KEY IF EXISTS `fk_analysis_resume`;

ALTER TABLE `analysis_results`
  ADD CONSTRAINT `fk_analysis_resume`
    FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.4  resume_sections.resume_id → CASCADE (table is empty but fix anyway)
ALTER TABLE `resume_sections`
  DROP FOREIGN KEY IF EXISTS `FK2qre6dt8fh13yh1q1pckd7eu1`,
  DROP FOREIGN KEY IF EXISTS `fk_resume_sections_resume`;

ALTER TABLE `resume_sections`
  ADD CONSTRAINT `fk_resume_sections_resume`
    FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 5.5  interview_sessions.user_id → CASCADE, resume_id → SET NULL
ALTER TABLE `interview_sessions`
  DROP FOREIGN KEY IF EXISTS `FKhresfe6p1s53klvmqhxxissa2`,
  DROP FOREIGN KEY IF EXISTS `FKoa5rgsdu7rqa8y74yph1fuqe5`,
  DROP FOREIGN KEY IF EXISTS `fk_isessions_user`,
  DROP FOREIGN KEY IF EXISTS `fk_isessions_resume`;

ALTER TABLE `interview_sessions`
  ADD CONSTRAINT `fk_isessions_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_isessions_resume`
    FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

SELECT 'Step 5 done: All FK constraints fixed to CASCADE/SET NULL' AS '';

-- ─────────────────────────────────────────────────────────────────────────────
SELECT '=====================================================' AS '';
SELECT '  STEP 6: ADD MISSING PERFORMANCE INDEXES            ' AS '';
SELECT '=====================================================' AS '';

-- users indexes
ALTER TABLE `users`
  ADD INDEX IF NOT EXISTS `idx_users_email_verified`  (`email_verified`),
  ADD INDEX IF NOT EXISTS `idx_users_provider`        (`auth_provider`),
  ADD INDEX IF NOT EXISTS `idx_users_plan`            (`plan`),
  ADD INDEX IF NOT EXISTS `idx_users_reset_otp`       (`password_reset_otp`, `email`);

-- resumes indexes (composite for history query: user + date)
ALTER TABLE `resumes`
  ADD INDEX IF NOT EXISTS `idx_resumes_user_uploaded` (`user_id`, `uploaded_at` DESC);

-- analysis_results indexes
ALTER TABLE `analysis_results`
  ADD INDEX IF NOT EXISTS `idx_analysis_analyzed_at`  (`analyzed_at` DESC);

-- interview_sessions indexes
ALTER TABLE `interview_sessions`
  ADD INDEX IF NOT EXISTS `idx_isessions_user_created` (`user_id`, `created_at` DESC);

-- token_usage composite index for monthly usage limit queries
-- Query: "How many cover_letters did user X use this month?"
ALTER TABLE `token_usage`
  ADD INDEX IF NOT EXISTS `idx_tu_user_feature_date`
    (`user_id`, `feature`, `created_at`);

SELECT 'Step 6 done: All performance indexes added' AS '';

-- ─────────────────────────────────────────────────────────────────────────────
SELECT '=====================================================' AS '';
SELECT '  STEP 7: ORPHAN DATA CLEANUP                       ' AS '';
SELECT '=====================================================' AS '';

-- Remove analysis_results where parent resume no longer exists
DELETE FROM `analysis_results`
WHERE `resume_id` NOT IN (SELECT `id` FROM `resumes`);

-- Remove interview_qa where parent session no longer exists
DELETE FROM `interview_qa`
WHERE `session_id` NOT IN (SELECT `id` FROM `interview_sessions`);

-- Clean up already-expired refresh tokens (if table has old data)
DELETE FROM `refresh_tokens` WHERE `expires_at` < NOW();

SELECT 'Step 7 done: Orphan data cleaned up' AS '';

-- ─────────────────────────────────────────────────────────────────────────────
SELECT '=====================================================' AS '';
SELECT '  STEP 8: AUTO-CLEANUP EVENT (Refresh Tokens)       ' AS '';
SELECT '=====================================================' AS '';

-- Enable event scheduler if not already on
SET GLOBAL event_scheduler = ON;

-- Daily cleanup of expired refresh tokens
DROP EVENT IF EXISTS `evt_cleanup_refresh_tokens`;
CREATE EVENT `evt_cleanup_refresh_tokens`
  ON SCHEDULE EVERY 1 DAY
  STARTS CURRENT_TIMESTAMP
  COMMENT 'Auto-deletes expired JWT refresh tokens every 24h'
  DO
    DELETE FROM `refresh_tokens` WHERE `expires_at` < NOW();

SELECT 'Step 8 done: Auto-cleanup event created' AS '';

-- ─────────────────────────────────────────────────────────────────────────────
SELECT '=====================================================' AS '';
SELECT '  FINAL: VERIFICATION                               ' AS '';
SELECT '=====================================================' AS '';

-- Show all tables
SHOW TABLES;

-- Show final users schema
SELECT
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME   = 'users'
ORDER BY ORDINAL_POSITION;

-- Show all indexes
SELECT
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, INDEX_NAME;

-- Show all FK constraints
SELECT
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  DELETE_RULE,
  UPDATE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = DATABASE()
ORDER BY TABLE_NAME;

SET FOREIGN_KEY_CHECKS = 1;

SELECT '=====================================================' AS '';
SELECT '  ✅ MASTER MIGRATION COMPLETE — vitaportal v2.0    ' AS '';
SELECT '=====================================================' AS '';
