# Axium Dashboard — Especificação do Schema

## Tabela: `metrics` (nova estrutura)

Após a migration v2, a tabela `metrics` foi alterada para suportar colunas variáveis:

| Coluna | Tipo | Padrão | Descrição |
|---|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` | Identificador único |
| `upload_id` | `UUID FK → uploads` | — | Referência ao upload de origem |
| `account_id` | `UUID FK → accounts` | — | Conta dona da métrica |
| `campaign_name` | `TEXT` | `''` | Nome da campanha (identificado fuzzy) |
| `report_date` | `DATE` | `NULL` | Data da métrica (identificada fuzzy) |
| `spend` | `NUMERIC(12,2)` | `0` | Valor usado/gasto (identificado fuzzy) |
| `raw_data` | `JSONB` | `'{}'` | Todas as colunas originais da planilha |

## Tabela: `financial_entries` (nova)

| Coluna | Tipo | Padrão | Descrição |
|---|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` | Identificador único |
| `account_id` | `UUID FK → accounts` | — | Conta dona do registro |
| `period_reference_month` | `INT` | — | Mês de referência (1-12) |
| `period_reference_year` | `INT` | — | Ano de referência |
| `total_received` | `NUMERIC(12,2)` | `0` | Valor total recebido no período |
| `payment_status` | `TEXT` | `'pendente'` | `pago` / `pendente` |
| `expense_type` | `TEXT` | `'variavel'` | `fixa` / `variavel` |
| `notes` | `TEXT` | `''` | Observações opcionais |
| `created_at` | `TIMESTAMPTZ` | `now()` | Data de criação |

## Parsing Flexível

O arquivo `lib/parseSpreadsheet.ts` não usa mapeamento fixo. Ele analisa os cabeçalhos da planilha usando padrões fuzzy:

- **Data**: detecta colunas com nomes como "data", "date", "dia", "período", "periodo"
- **Campanha**: detecta colunas como "campanha", "campaign", "anúncio", "anuncio", "ads", "ad name"
- **Valor**: detecta colunas como "valor", "valor usado", "investimento", "spend", "amount", "gasto", "custo", "cost"
- **Raw data**: todas as colunas são preservadas no campo `raw_data` (JSONB)

Isso permite importar qualquer exportação do Meta Ads Manager, Google Ads, etc., sem precisar alterar o código.

## Dashboard Dinâmico

A função `generateWidgets()` em `lib/metrics.ts` analisa automaticamente as colunas disponíveis no `raw_data`:

- **Colunas numéricas** → cards de resumo (Total Gasto, Receita, etc.)
- **Colunas categóricas** (≤ 15 valores únicos) → gráficos de distribuição (donut)
- **Colunas de texto** com muitos valores + primeira coluna numérica → rankings (Top N)
- **Múltiplos períodos** → gráfico de evolução

## Seção Financeira

Além dos widgets dinâmicos, o dashboard exibe uma seção financeira separada:

- **Total Gasto**: soma de `spend` das métricas do período
- **Total Recebido**: soma de `total_received` dos registros financeiros
- **Saldo**: Total Recebido - Total Gasto
- **Pendente**: soma de `total_received` onde `payment_status = 'pendente'`
- **Donuts**: Status de Pagamento (Pago/Pendente) e Tipo de Despesa (Fixa/Variável)

Os dados financeiros são gerenciados manualmente via `/admin/[accountId]/financeiro`.

## APIs

| Rota | Método | Descrição |
|---|---|---|
| `/api/upload` | POST | Upload de planilha (multipart: file, account_id, period_month, period_year) |
| `/api/financial` | GET | Lista entradas financeiras de uma conta/período |
| `/api/financial` | POST | Cria/atualiza entrada financeira |
| `/api/dashboard/[slug]` | GET | Retorna financial + widgets + períodos disponíveis |

## Migration

O arquivo `supabase/migrations/v2_universal_columns.sql` contém a migration para alterar a tabela `metrics` existente e migrar os dados. **Deve ser executada manualmente no SQL Editor do Supabase** antes de usar as novas funcionalidades.
