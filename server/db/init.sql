-- ============================================
-- Personal Finance Tracker — Database Schema
-- Demonstrates: Normalization, Foreign Keys,
--   CASCADE deletes, ENUMs, Indexes
-- ============================================

CREATE DATABASE IF NOT EXISTS finance_tracker;
USE finance_tracker;

-- ---- Users ----
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ---- Accounts (bank accounts, wallets, credit cards) ----
CREATE TABLE IF NOT EXISTS accounts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT            NOT NULL,
  name        VARCHAR(100)   NOT NULL,
  type        ENUM('checking', 'savings', 'credit_card', 'cash', 'investment') NOT NULL DEFAULT 'checking',
  balance     DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---- Categories ----
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT           NOT NULL,
  name        VARCHAR(80)   NOT NULL,
  type        ENUM('income', 'expense') NOT NULL DEFAULT 'expense',
  icon        VARCHAR(50)   DEFAULT '📁',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---- Transactions ----
CREATE TABLE IF NOT EXISTS transactions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT            NOT NULL,
  account_id   INT            NOT NULL,
  category_id  INT            NOT NULL,
  type         ENUM('income', 'expense') NOT NULL,
  amount       DECIMAL(12,2)  NOT NULL,
  description  VARCHAR(255)   DEFAULT '',
  date         DATE           NOT NULL,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (account_id)  REFERENCES accounts(id)    ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE CASCADE,

  INDEX idx_user_date (user_id, date),
  INDEX idx_user_category (user_id, category_id)
);

-- ---- Budgets (monthly budget per category) ----
CREATE TABLE IF NOT EXISTS budgets (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT            NOT NULL,
  category_id  INT            NOT NULL,
  amount       DECIMAL(12,2)  NOT NULL,
  month        TINYINT        NOT NULL,   -- 1-12
  year         SMALLINT       NOT NULL,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE CASCADE,

  UNIQUE KEY uq_user_cat_period (user_id, category_id, month, year)
);
