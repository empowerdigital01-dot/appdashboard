-- Axium Dashboard — Schema do Banco de Dados

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Tabela: accounts
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  access_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Tabela: uploads
-- ============================================
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  period_month INT NOT NULL,
  period_year INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uploads_account_id ON uploads(account_id);

-- ============================================
-- Tabela: metrics
-- ============================================
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  campaign TEXT NOT NULL DEFAULT '',
  date DATE,
  investment NUMERIC(12,2) NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  impressions INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_metrics_upload_id ON metrics(upload_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy pública — todo acesso via service_role key no backend
-- Revoga acesso público anônimo
REVOKE ALL ON accounts FROM anon, authenticated;
REVOKE ALL ON uploads FROM anon, authenticated;
REVOKE ALL ON metrics FROM anon, authenticated;
