-- ============================================================
-- Vita AI — Admin Panel Migration
-- phpMyAdmin → Select 'resume_ai_db' → SQL tab → Paste → Go
-- ============================================================

-- Admin users table (standalone, separate from users table)
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL DEFAULT 'Admin',
  created_at DATETIME(6) DEFAULT NOW(6)
);

-- Token usage tracking (tracks every AI API call)
CREATE TABLE IF NOT EXISTS token_usage (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NULL,
  model VARCHAR(20) NOT NULL DEFAULT 'gpt',
  feature VARCHAR(50) NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  created_at DATETIME(6) DEFAULT NOW(6),
  INDEX idx_tu_user (user_id),
  INDEX idx_tu_model (model),
  INDEX idx_tu_feature (feature),
  INDEX idx_tu_created (created_at),
  CONSTRAINT fk_token_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
