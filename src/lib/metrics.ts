export interface MetricRow {
  campaign: string
  date: string
  investment: number
  revenue: number
  clicks: number
  impressions: number
  conversions: number
  status: string
  type: string
  upload_period?: string
}

export interface DashboardMetrics {
  saldoPeriodo: number
  totalRecebido: number
  totalGasto: number
  totalPago: number
  totalPendente: number
  roas: number
  fixasTotal: number
  variaveisTotal: number
  statusCounts: Record<string, number>
  statusRevenue: Record<string, number>
  topExpenses: { name: string; value: number }[]
  evolutionData: { period: string; investment: number; revenue: number }[]
  donutReceitasDespesas: { name: string; value: number }[]
  donutFixasVariaveis: { name: string; value: number }[]
  donutStatus: { name: string; value: number }[]
}

export function calculateMetrics(
  rows: MetricRow[],
  allPeriods?: { period: string; rows: MetricRow[] }[]
): DashboardMetrics {
  const totalInvestment = rows.reduce((s, r) => s + r.investment, 0)
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0)

  const rowsPago = rows.filter((r) => r.status.toLowerCase() === 'pago')
  const totalPago = rowsPago.reduce((s, r) => s + r.investment, 0)
  const totalRecebido = rowsPago.reduce((s, r) => s + r.revenue, 0)

  const totalPendente = rows
    .filter((r) => r.status.toLowerCase() !== 'pago')
    .reduce((s, r) => s + r.investment, 0)

  const fixasTotal = rows
    .filter((r) => r.type.toLowerCase() === 'fixa')
    .reduce((s, r) => s + r.investment, 0)
  const variaveisTotal = rows
    .filter((r) => r.type.toLowerCase() === 'variável' || r.type.toLowerCase() === 'variavel')
    .reduce((s, r) => s + r.investment, 0)

  const roas = totalInvestment > 0 ? totalRevenue / totalInvestment : 0

  const statusCounts: Record<string, number> = {}
  const statusRevenue: Record<string, number> = {}
  rows.forEach((r) => {
    const s = r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase()
    statusCounts[s] = (statusCounts[s] || 0) + r.investment
    statusRevenue[s] = (statusRevenue[s] || 0) + r.revenue
  })

  // Top 5 despesas (campanhas com maior investimento)
  const campaignTotals: Record<string, number> = {}
  rows.forEach((r) => {
    campaignTotals[r.campaign] =
      (campaignTotals[r.campaign] || 0) + r.investment
  })
  const topExpenses = Object.entries(campaignTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  // Donut: Receitas vs Despesas
  const donutReceitasDespesas = [
    { name: 'Receitas', value: totalRevenue },
    { name: 'Despesas', value: totalInvestment },
  ]

  // Donut: Fixas vs Variáveis
  const donutFixasVariaveis = [
    { name: 'Fixas', value: fixasTotal },
    { name: 'Variáveis', value: variaveisTotal },
  ]

  // Donut: Status Geral
  const donutStatus = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }))

  // Evolution data across periods
  const evolutionData = (allPeriods || []).map((p) => ({
    period: p.period,
    investment: p.rows.reduce((s, r) => s + r.investment, 0),
    revenue: p.rows.reduce((s, r) => s + r.revenue, 0),
  }))

  return {
    saldoPeriodo: totalRevenue - totalInvestment,
    totalRecebido,
    totalGasto: totalInvestment,
    totalPago,
    totalPendente,
    roas,
    fixasTotal,
    variaveisTotal,
    statusCounts,
    statusRevenue,
    topExpenses,
    evolutionData,
    donutReceitasDespesas,
    donutFixasVariaveis,
    donutStatus,
  }
}
