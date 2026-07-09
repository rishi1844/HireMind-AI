-- ============================================================
-- Vita AI — Database Migration (phpMyAdmin friendly)
-- phpMyAdmin → Select 'resume_ai_db' → SQL tab → Paste → Go
-- ============================================================

-- Fix 1: Rename old column if it exists (run only if you see 'is_email_verified' in your table)
-- If you get an error "Unknown column", skip this line and go to Fix 2
ALTER TABLE users CHANGE COLUMN is_email_verified email_verified TINYINT(1) NOT NULL DEFAULT 0;

-- Fix 2: Ensure email_verified has DEFAULT 0 (safe to run always)
ALTER TABLE users MODIFY COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0;

-- Fix 3: Upgrade profile_picture from TEXT (64KB) to MEDIUMTEXT (16MB)
ALTER TABLE users MODIFY COLUMN profile_picture MEDIUMTEXT NULL;
