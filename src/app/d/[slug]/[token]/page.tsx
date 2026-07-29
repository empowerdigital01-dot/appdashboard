'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import SummaryCard from '@/components/SummaryCard'
import DonutCard from '@/components/DonutCard'
import TopExpensesList from '@/components/TopExpensesList'
import EvolutionChart from '@/components/EvolutionChart'
import PeriodSelector from '@/components/PeriodSelector'
import type { Widget, FinancialSummary } from '@/lib/metrics'

interface Period {
  month: number
  year: number
  label: string
}

interface DashboardData {
  financial: (FinancialSummary & { totalSpend: number; balance: number }) | null
  widgets: Widget[]
  availablePeriods: Period[]
  currentPeriod: Period | null
}

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatNumber(v: number) {
  return v.toLocaleString('pt-BR')
}

function formatWidgetValue(widget: Widget & { type: 'summary' }): string {
  return widget.format === 'currency' ? formatCurrency(widget.value) : formatNumber(widget.value)
}

function FinancialSection({ financial }: { financial: NonNullable<DashboardData['financial']> }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-axium-muted">
        Financeiro
      </h2>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SummaryCard
          title="Total Gasto"
          value={formatCurrency(financial.totalSpend)}
          color="negative"
        />
        <SummaryCard
          title="Total Recebido"
          value={formatCurrency(financial.totalReceived)}
          color="positive"
        />
        <SummaryCard
          title="Saldo"
          value={formatCurrency(financial.balance)}
          color={financial.balance >= 0 ? 'positive' : 'negative'}
        />
        <SummaryCard
          title="Pendente"
          value={formatCurrency(financial.totalPendente)}
          color={financial.totalPendente > 0 ? 'negative' : 'positive'}
        />
      </div>
      {financial.statusDistribution.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DonutCard
            title="Status de Pagamento"
            data={financial.statusDistribution}
            colors={['#D4D4D4', '#5C5C5C']}
          />
          {financial.typeDistribution.length > 0 && (
            <DonutCard
              title="Tipo de Despesa"
              data={financial.typeDistribution}
              colors={['#A0A0A0', '#2A2A2A']}
            />
          )}
        </div>
      )}
    </div>
  )
}

function DonutGrid({ widgets }: { widgets: Widget[] }) {
  const donuts = widgets.filter((w): w is Widget & { type: 'donut' } => w.type === 'donut')
  if (donuts.length === 0) return null

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {donuts.map((w) => (
        <DonutCard key={w.title} title={w.title} data={w.data} colors={w.colors} />
      ))}
    </div>
  )
}

function TopListsGrid({ widgets }: { widgets: Widget[] }) {
  const lists = widgets.filter((w): w is Widget & { type: 'top-list' } => w.type === 'top-list')
  if (lists.length === 0) return null

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lists.map((w) => (
        <TopExpensesList
          key={w.title}
          title={w.title}
          expenses={w.data}
          formatValue={w.format === 'currency' ? formatCurrency : formatNumber}
        />
      ))}
    </div>
  )
}

function EvolutionSection({ widgets }: { widgets: Widget[] }) {
  const evolutions = widgets.filter((w): w is Widget & { type: 'evolution' } => w.type === 'evolution')
  if (evolutions.length === 0) return null

  return (
    <div className="mb-6">
      {evolutions.map((w) => (
        <EvolutionChart key={w.title} title={w.title} data={w.data} series={w.series} />
      ))}
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

  const { widgets, availablePeriods, financial } = data

  const summaryWidgets = widgets.filter((w): w is Widget & { type: 'summary' } => w.type === 'summary')

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

        {financial && <FinancialSection financial={financial} />}

        {summaryWidgets.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {summaryWidgets.map((w) => (
              <SummaryCard key={w.title} title={w.title} value={formatWidgetValue(w)} color={w.color} />
            ))}
          </div>
        )}

        <DonutGrid widgets={widgets} />
        <TopListsGrid widgets={widgets} />
        <EvolutionSection widgets={widgets} />
      </div>
    </div>
  )
}
