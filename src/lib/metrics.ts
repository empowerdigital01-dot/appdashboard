import { parseNumber } from './parseSpreadsheet'

export interface FinancialSummary {
  totalSpend: number
  totalReceived: number
  balance: number
  totalPendente: number
  statusDistribution: { name: string; value: number }[]
  typeDistribution: { name: string; value: number }[]
}

export function computeFinancialSummary(
  entries: { total_received: number; payment_status: string; expense_type: string }[],
  totalSpend: number
): FinancialSummary {
  const totalReceived = entries.reduce((s, e) => s + e.total_received, 0)
  const totalPendente = entries
    .filter((e) => e.payment_status === 'pendente')
    .reduce((s, e) => s + e.total_received, 0)

  const statusCounts: Record<string, number> = {}
  const typeCounts: Record<string, number> = {}
  for (const e of entries) {
    const st = e.payment_status === 'pago' ? 'Pago' : 'Pendente'
    statusCounts[st] = (statusCounts[st] || 0) + e.total_received
    const tp = e.expense_type === 'fixa' ? 'Fixa' : 'Variável'
    typeCounts[tp] = (typeCounts[tp] || 0) + e.total_received
  }

  return {
    totalSpend,
    totalReceived,
    balance: totalReceived - totalSpend,
    totalPendente,
    statusDistribution: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    typeDistribution: Object.entries(typeCounts).map(([name, value]) => ({ name, value })),
  }
}

export function computeTopCampaigns(
  rows: { campaign_name: string; spend: number }[]
): { name: string; spend: number }[] {
  const groups = new Map<string, number>()
  for (const r of rows) {
    const key = r.campaign_name || '(sem nome)'
    groups.set(key, (groups.get(key) || 0) + r.spend)
  }

  return Array.from(groups.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, spend]) => ({ name, spend }))
}

export function computeEvolution(
  periods: { period: string; rows: { spend: number }[] }[]
): { period: string; spend: number }[] {
  return periods.map((p) => ({
    period: p.period,
    spend: p.rows.reduce((s, r) => s + r.spend, 0),
  }))
}

const EXCLUDED_COLS = new Set([
  'campaign_name', 'report_date', 'spend',
])

export function getRawDataColumns(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return []
  return Object.keys(rows[0]).filter((col) => !EXCLUDED_COLS.has(col))
}
