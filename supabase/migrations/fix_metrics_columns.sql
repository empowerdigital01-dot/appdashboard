-- ============================================================
-- Migration: fix_metrics_columns
-- 
-- O schema.sql foi atualizado para usar uma coluna JSONB `data`
-- que armazena dinamicamente todas as colunas da planilha.
-- O banco real ainda tem colunas fixas (campaign, date, etc).
--
-- Esta migration:
--   1. Adiciona a coluna `data JSONB`
--   2. Migra registros existentes das colunas fixas para JSONB
--   3. Remove as colunas fixas antigas
-- ============================================================

-- 1. Adiciona coluna JSONB
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}';

-- 2. Migra dados existentes das colunas fixas para JSONB
UPDATE metrics
SET data = jsonb_build_object(
  'Campanha',     campaign,
  'Data',         date::text,
  'Investimento', investment,
  'Receita',      revenue,
  'Cliques',      clicks,
  'Impressões',   impressions,
  'Conversões',   conversions,
  'Status',       status,
  'Tipo',         type
)
WHERE data = '{}'::jsonb
  AND campaign IS NOT NULL;

-- 3. Remove colunas fixas antigas
ALTER TABLE metrics DROP COLUMN IF EXISTS campaign;
ALTER TABLE metrics DROP COLUMN IF EXISTS date;
ALTER TABLE metrics DROP COLUMN IF EXISTS investment;
ALTER TABLE metrics DROP COLUMN IF EXISTS revenue;
ALTER TABLE metrics DROP COLUMN IF EXISTS clicks;
ALTER TABLE metrics DROP COLUMN IF EXISTS impressions;
ALTER TABLE metrics DROP COLUMN IF EXISTS conversions;
ALTER TABLE metrics DROP COLUMN IF EXISTS status;
ALTER TABLE metrics DROP COLUMN IF EXISTS type;
