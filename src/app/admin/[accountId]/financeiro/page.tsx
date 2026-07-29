'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function FinanceiroPage() {
  const { accountId } = useParams()
  const router = useRouter()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [totalReceived, setTotalReceived] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'pago' | 'pendente'>('pago')
  const [expenseType, setExpenseType] = useState<'fixa' | 'variavel'>('fixa')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const value = parseFloat(totalReceived.replace(',', '.'))
    if (isNaN(value) || value <= 0) {
      setError('Informe um valor recebido válido')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: accountId,
          month,
          year,
          total_received: value,
          payment_status: paymentStatus,
          expense_type: expenseType,
          notes: notes.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        setError(errData.error || 'Erro ao salvar')
        return
      }

      setSuccess(`Entrada financeira salva para ${MONTHS[month - 1]} de ${year}`)
      setTotalReceived('')
      setNotes('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-axium-bg p-4 sm:p-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="rounded-lg border border-axium-border px-3 py-1.5 text-sm text-axium-muted transition hover:text-white"
          >
            ← Voltar
          </button>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Dados Financeiros</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-axium-border bg-axium-card p-4 sm:p-6">
          <div>
            <label className="mb-1 block text-sm text-axium-muted">Período de Referência</label>
            <div className="flex gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="flex-1 rounded-lg border border-axium-border bg-axium-bg px-3 py-2 text-white outline-none focus:border-white"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 rounded-lg border border-axium-border bg-axium-bg px-3 py-2 text-white outline-none focus:border-white"
                min={2020}
                max={2030}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-axium-muted">Total Recebido do Cliente (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={totalReceived}
              onChange={(e) => setTotalReceived(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-lg border border-axium-border bg-axium-bg px-3 py-2 text-white outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-axium-muted">Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as 'pago' | 'pendente')}
              className="w-full rounded-lg border border-axium-border bg-axium-bg px-3 py-2 text-white outline-none focus:border-white"
            >
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-axium-muted">Tipo</label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value as 'fixa' | 'variavel')}
              className="w-full rounded-lg border border-axium-border bg-axium-bg px-3 py-2 text-white outline-none focus:border-white"
            >
              <option value="fixa">Fixa</option>
              <option value="variavel">Variável</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-axium-muted">Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-axium-border bg-axium-bg px-3 py-2 text-white outline-none focus:border-white"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-axium-negative/30 bg-axium-negative/10 px-4 py-3 text-sm text-axium-negative">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-axium-positive/30 bg-axium-positive/10 px-4 py-3 text-sm text-axium-positive">
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-white px-4 py-2 font-bold text-black transition hover:bg-axium-positive disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="rounded-lg border border-axium-border px-4 py-2 text-axium-muted transition hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
