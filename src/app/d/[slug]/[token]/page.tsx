'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import SummaryCard from '@/components/SummaryCard'
import DonutCard from '@/components/DonutCard'
import TopExpensesList from '@/components/TopExpensesList'
import EvolutionChart from '@/components/EvolutionChart'
import PeriodSelector from '@/components/PeriodSelector'
import type { DashboardMetrics } from '@/lib/metrics'

interface Period {
  month: number
  year: number
  label: string
}

interface DashboardData {
  metrics: DashboardMetrics
  availablePeriods: Period[]
  currentPeriod: Period | null
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

  const { metrics, availablePeriods } = data

  function formatCurrency(v: number) {
    return `R$ ${v.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

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

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <SummaryCard
            title="Saldo do Período"
            value={formatCurrency(metrics.saldoPeriodo)}
            color={metrics.saldoPeriodo >= 0 ? 'positive' : 'negative'}
          />
          <SummaryCard
            title="Total Recebido"
            value={formatCurrency(metrics.totalRecebido)}
            color="positive"
          />
          <SummaryCard
            title="Total Gasto"
            value={formatCurrency(metrics.totalGasto)}
            color="negative"
          />
          <SummaryCard
            title="Pendências"
            value={formatCurrency(metrics.totalPendente)}
            color="attention"
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DonutCard
            title="Receitas vs Despesas"
            data={metrics.donutReceitasDespesas}
            colors={['#D4D4D4', '#5C5C5C']}
          />
          <DonutCard
            title="Fixas vs Variáveis"
            data={metrics.donutFixasVariaveis}
            colors={['#A0A0A0', '#B8B8B8']}
          />
          <DonutCard
            title="Status Geral"
            data={metrics.donutStatus}
            colors={['#D4D4D4', '#A0A0A0', '#5C5C5C', '#B8B8B8']}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <TopExpensesList expenses={metrics.topExpenses} />
          </div>
          <div className="lg:col-span-2">
            <EvolutionChart data={metrics.evolutionData} />
          </div>
        </div>
      </div>
    </div>
  )
}
