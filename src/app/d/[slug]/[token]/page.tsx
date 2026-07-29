'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import SummaryCard from '@/components/SummaryCard'
import DonutCard from '@/components/DonutCard'
import TopExpensesList from '@/components/TopExpensesList'
import EvolutionChart from '@/components/EvolutionChart'
import PeriodSelector from '@/components/PeriodSelector'
import type { FinancialSummary } from '@/lib/metrics'
import { detectMetricFormat, formatMetricValue } from '@/lib/formatMetric'

interface Period {
  month: number
  year: number
  label: string
}

interface DashboardData {
  financial: FinancialSummary
  topCampaigns: { name: string; spend: number }[]
  evolution: { period: string; spend: number }[]
  rawDataColumns: string[]
  campaignMetrics: Record<string, unknown>[]
  availablePeriods: Period[]
  currentPeriod: Period | null
}

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function SummaryCards({ financial }: { financial: FinancialSummary }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <SummaryCard
        title="Saldo do Período"
        value={formatCurrency(financial.balance)}
        color={financial.balance >= 0 ? 'positive' : 'negative'}
      />
      <SummaryCard
        title="Total Recebido"
        value={formatCurrency(financial.totalReceived)}
        color="positive"
      />
      <SummaryCard
        title="Total Gasto"
        value={formatCurrency(financial.totalSpend)}
        color="negative"
      />
      <SummaryCard
        title="Pendências"
        value={formatCurrency(financial.totalPendente)}
        color={financial.totalPendente > 0 ? 'negative' : 'positive'}
      />
    </div>
  )
}

function DonutsSection({ financial }: { financial: FinancialSummary }) {
  const receitaDespesa = [
    { name: 'Receitas', value: financial.totalReceived },
    { name: 'Despesas', value: financial.totalSpend },
  ]

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <DonutCard
        title="Receitas vs Despesas"
        data={receitaDespesa}
        colors={['#5C5C5C', '#D4D4D4']}
        formatValue={(v) => formatCurrency(v)}
      />
      <DonutCard
        title="Fixas vs Variáveis"
        data={financial.typeDistribution.length > 0 ? financial.typeDistribution : []}
        colors={['#A0A0A0', '#2A2A2A']}
        formatValue={(v) => formatCurrency(v)}
      />
      <DonutCard
        title="Status Geral"
        data={financial.statusDistribution.length > 0 ? financial.statusDistribution : []}
        colors={['#5C5C5C', '#D4D4D4']}
        formatValue={(v) => formatCurrency(v)}
      />
    </div>
  )
}

function CampaignMetricsSection({
  columns,
  rows,
}: {
  columns: string[]
  rows: Record<string, unknown>[]
}) {
  if (columns.length === 0 || rows.length === 0) return null

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-axium-muted">
        Métricas de Campanha
      </h2>
      <div className="overflow-x-auto rounded-xl border border-axium-border bg-axium-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-axium-border">
              <th className="whitespace-nowrap px-4 py-3 font-semibold text-axium-muted">#</th>
              {columns.map((col) => (
                <th key={col} className="whitespace-nowrap px-4 py-3 font-semibold text-axium-muted">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-axium-border last:border-b-0 hover:bg-axium-bg/40">
                <td className="px-4 py-3 text-axium-neutral">{i + 1}</td>
                {columns.map((col) => {
                  const raw = row[col]
                  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.')) || 0
                  const fmt = detectMetricFormat(col)
                  return (
                    <td key={col} className="whitespace-nowrap px-4 py-3 text-white">
                      {formatMetricValue(num, fmt)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PublicDashboardPage() {
  const { slug, token } = useParams()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const initialLoadDone = useRef(false)
  const fetchIdRef = useRef(0)

  const fetchData = useCallback(
    async (period?: Period) => {
      const fetchId = ++fetchIdRef.current

      const params = new URLSearchParams({ token: token as string })
      if (period) {
        params.set('month', String(period.month))
        params.set('year', String(period.year))
      }

      try {
        const res = await fetch(`/api/dashboard/${slug}?${params.toString()}`)

        if (fetchId !== fetchIdRef.current) return

        if (!res.ok) {
          setError(true)
          setLoading(false)
          return
        }

        const json: DashboardData = await res.json()

        if (fetchId !== fetchIdRef.current) return

        setData(json)
        if (!initialLoadDone.current) {
          initialLoadDone.current = true
          if (json.currentPeriod) {
            setSelectedPeriod(json.currentPeriod)
          }
        }
        setLoading(false)
      } catch {
        if (fetchId === fetchIdRef.current) {
          setError(true)
          setLoading(false)
        }
      }
    },
    [slug, token]
  )

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 0)
    return () => clearTimeout(timer)
  }, [fetchData])

  function handlePeriodChange(period: Period) {
    setSelectedPeriod(period)
    fetchData(period)
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-axium-bg px-4">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-white">404</h1>
          <p className="text-axium-muted">Dashboard não encontrado</p>
        </div>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-axium-bg">
        <p className="text-axium-muted">Carregando...</p>
      </div>
    )
  }

  const { financial, topCampaigns, evolution, rawDataColumns, campaignMetrics, availablePeriods } = data

  return (
    <div className="min-h-screen bg-axium-bg p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-bold text-white sm:text-xl">Axium Dashboard</h1>
          <PeriodSelector
            periods={availablePeriods}
            currentPeriod={selectedPeriod}
            onChange={handlePeriodChange}
          />
        </div>

        {/* 1. 4 Summary Cards */}
        <SummaryCards financial={financial} />

        {/* 2. 3 Donuts */}
        <DonutsSection financial={financial} />

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* 3. Top 5 Despesas */}
          <TopExpensesList
            title="Top 5 Despesas"
            expenses={topCampaigns.map((c) => ({ name: c.name, value: c.spend }))}
            formatValue={(v) => formatCurrency(v)}
          />

          {/* 4. Evolução Mensal */}
          <EvolutionChart
            title="Evolução Mensal"
            data={evolution}
            series={[{ dataKey: 'spend', name: 'Gasto', color: '#D4D4D4' }]}
          />
        </div>

        {/* 5. Métricas de Campanha */}
        <CampaignMetricsSection columns={rawDataColumns} rows={campaignMetrics} />
      </div>
    </div>
  )
}
