-- =============================================================================
-- HireMind AI — Database Migration Script
-- Phase 2.3: JWT Refresh Tokens
-- Phase 4.1: User Plan Fields (Free vs Pro)
-- =============================================================================
-- Run this script ONCE on your MySQL database after deploying the new backend.
-- Safe to run multiple times — uses IF NOT EXISTS / IF NOT EXISTS checks.
-- =============================================================================

-- ─── Phase 2.3: Refresh Tokens table ─────────────────────────────────────────
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

-- ─── Phase 4.1: User Plan Fields ─────────────────────────────────────────────
-- Add `plan` column (default 'free') if it doesn't already exist
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'plan'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `plan` VARCHAR(20) NOT NULL DEFAULT ''free'' AFTER `auth_provider`',
  'SELECT ''column plan already exists'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `plan_expires_at` column if it doesn't already exist
SET @col_exists2 = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'plan_expires_at'
);

SET @sql2 = IF(@col_exists2 = 0,
  'ALTER TABLE `users` ADD COLUMN `plan_expires_at` DATETIME(6) NULL AFTER `plan`',
  'SELECT ''column plan_expires_at already exists'' AS info'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- ─── Verify ───────────────────────────────────────────────────────────────────
SHOW TABLES LIKE 'refresh_tokens';
DESCRIBE `users`;
