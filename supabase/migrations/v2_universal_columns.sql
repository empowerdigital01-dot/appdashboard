-- ============================================================
-- Migration v2: universal columns + financial_entries
--
-- 1. Adiciona account_id, campaign_name, report_date, spend,
--    raw_data à tabela metrics
-- 2. Migra dados existentes das colunas antigas para as novas
-- 3. Remove colunas antigas
-- 4. Cria a tabela financial_entries
-- ============================================================

-- 1. Adiciona colunas à tabela metrics
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id);
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS campaign_name TEXT DEFAULT '';
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS report_date DATE;
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS spend NUMERIC(12,2) DEFAULT 0;
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}';

-- 2. Migra dados existentes
UPDATE metrics m
SET account_id = u.account_id,
    campaign_name = m.campaign,
    report_date = m.date,
    spend = m.investment,
    raw_data = jsonb_build_object(
      'Campanha',    m.campaign,
      'Data',        m.date::text,
      'Investimento', m.investment,
      'Receita',     m.revenue,
      'Cliques',     m.clicks,
      'Impressões',  m.impressions,
      'Conversões',  m.conversions,
      'Status',      m.status,
      'Tipo',        m.type
    )
FROM uploads u
WHERE u.id = m.upload_id
  AND m.account_id IS NULL;

-- 3. Torna colunas NOT NULL
ALTER TABLE metrics ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE metrics ALTER COLUMN campaign_name SET NOT NULL;
ALTER TABLE metrics ALTER COLUMN spend SET NOT NULL;
ALTER TABLE metrics ALTER COLUMN raw_data SET NOT NULL;

-- 4. Remove colunas antigas
ALTER TABLE metrics DROP COLUMN IF EXISTS campaign;
ALTER TABLE metrics DROP COLUMN IF EXISTS date;
ALTER TABLE metrics DROP COLUMN IF EXISTS investment;
ALTER TABLE metrics DROP COLUMN IF EXISTS revenue;
ALTER TABLE metrics DROP COLUMN IF EXISTS clicks;
ALTER TABLE metrics DROP COLUMN IF EXISTS impressions;
ALTER TABLE metrics DROP COLUMN IF EXISTS conversions;
ALTER TABLE metrics DROP COLUMN IF EXISTS status;
ALTER TABLE metrics DROP COLUMN IF EXISTS type;

-- 5. Cria índices novos
CREATE INDEX IF NOT EXISTS idx_metrics_account_id ON metrics(account_id);

-- 6. Cria tabela financial_entries
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

ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON financial_entries FROM anon, authenticated;
