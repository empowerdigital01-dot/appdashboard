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
-- Tabela: metrics (colunas universais + raw_data flexível)
-- ============================================
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL DEFAULT '',
  report_date DATE,
  spend NUMERIC(12,2) NOT NULL DEFAULT 0,
  raw_data JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_metrics_upload_id ON metrics(upload_id);
CREATE INDEX IF NOT EXISTS idx_metrics_account_id ON metrics(account_id);

-- ============================================
-- Tabela: financial_entries (dados financeiros manuais)
-- ============================================
CREATE TABLE IF NOT EXISTS financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  period_reference DATE NOT NULL,
  total_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pago', 'pendente')),
  expense_type TEXT NOT NULL CHECK (expense_type IN ('fixa', 'variavel')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_account_id ON financial_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_period ON financial_entries(period_reference);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy pública — todo acesso via service_role key no backend
REVOKE ALL ON accounts FROM anon, authenticated;
REVOKE ALL ON uploads FROM anon, authenticated;
REVOKE ALL ON metrics FROM anon, authenticated;
REVOKE ALL ON financial_entries FROM anon, authenticated;
