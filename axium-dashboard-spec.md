# Axium Dashboard — Especificação do Schema

## Tabela: `metrics` (produção)

| Coluna | Tipo | Padrão | Descrição |
|---|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` | Identificador único |
| `upload_id` | `UUID FK → uploads` | — | Referência ao upload de origem |
| `campaign` | `TEXT` | `''` | Nome da campanha |
| `date` | `DATE` | `NULL` | Data da métrica |
| `investment` | `NUMERIC(12,2)` | `0` | Investimento (R$) |
| `revenue` | `NUMERIC(12,2)` | `0` | Receita (R$) |
| `clicks` | `INT` | `0` | Cliques |
| `impressions` | `INT` | `0` | Impressões |
| `conversions` | `INT` | `0` | Conversões |
| `status` | `TEXT` | `''` | Status (ex: Pago, Pendente) |
| `type` | `TEXT` | `''` | Tipo (ex: Google Ads, Meta Ads) |

Todas as colunas estão em **inglês** e correspondem diretamente aos nomes usados no banco Supabase.

## Mapeamento Planilha → Banco

O arquivo `lib/parseSpreadsheet.ts` mapeia os cabeçalhos em português da planilha do usuário para as colunas em inglês do banco:

| Cabeçalho na Planilha (PT) | Coluna no Banco (EN) |
|---|---|
| Campanha | `campaign` |
| Data | `date` |
| Investimento | `investment` |
| Receita | `revenue` |
| Cliques | `clicks` |
| Impressões | `impressions` |
| Conversões | `conversions` |
| Status | `status` |
| Tipo | `type` |

## Dashboard Dinâmico

O dashboard não possui blocos fixos de métricas. A função `generateWidgets()` em `lib/metrics.ts` analisa as colunas disponíveis nos dados e gera widgets automaticamente:

- **Colunas numéricas** (`investment`, `revenue`, `clicks`, etc.) → cards de resumo
- **Colunas categóricas** (≤ 15 valores únicos: `status`, `type`) → gráficos de distribuição
- **Colunas de texto** com muitos valores (`campaign`) → rankings (top N)
- **Múltiplos períodos** → gráfico de evolução

Os títulos dos widgets são exibidos em português via `DISPLAY_NAMES`.
