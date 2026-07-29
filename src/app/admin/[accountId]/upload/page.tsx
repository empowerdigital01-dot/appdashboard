'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function UploadPage() {
  const { accountId } = useParams()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fileSelected, setFileSelected] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Selecione um arquivo .xlsx ou .csv')
      return
    }

    const isXlsx = file.name.endsWith('.xlsx')
    const isCsv = file.name.endsWith('.csv')
    if (!isXlsx && !isCsv) {
      setError('Formato inválido. Use .xlsx ou .csv')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('account_id', accountId as string)
      formData.append('period_month', String(month))
      formData.append('period_year', String(year))

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        setError(errData.error || 'Erro ao fazer upload')
        return
      }

      const resultData = await res.json()
      const rowCount = resultData.rows_imported ?? 'N'
      setSuccess(
        `Planilha importada com sucesso! ${rowCount} linha${rowCount !== 1 ? 's' : ''} processada${rowCount !== 1 ? 's' : ''} em ${MONTHS[month - 1]} de ${year}.`
      )
      fileRef.current!.value = ''
      setFileSelected(false)
    } finally {
      setUploading(false)
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
          <h1 className="text-xl font-bold text-white sm:text-2xl">Upload de Planilha</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-axium-border bg-axium-card p-4 sm:p-6">
          <div>
            <label className="mb-1 block text-sm text-axium-muted">
              Período de Referência
            </label>
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
            <label className="mb-1 block text-sm text-axium-muted">
              Arquivo (.xlsx ou .csv)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => setFileSelected(!!e.target.files?.[0])}
              className="w-full text-sm text-axium-muted file:mr-3 file:rounded file:border-0 file:bg-axium-border file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-axium-negative"
            />
            <p className="mt-1 text-xs text-axium-neutral">
              O dashboard se adapta automaticamente às colunas da sua planilha. Colunas numéricas viram cards de resumo, colunas categóricas viram gráficos.
            </p>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-axium-muted">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processando planilha...
            </div>
          )}

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
              disabled={uploading || !fileSelected}
              className="rounded-lg bg-white px-4 py-2 font-bold text-black transition hover:bg-axium-positive disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? 'Enviando...' : 'Enviar planilha'}
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
