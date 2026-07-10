'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewAccountPage() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erro ao criar conta')
      return
    }

    router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-axium-bg p-4 sm:p-6">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-xl font-bold text-white sm:text-2xl">Nova Conta</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-axium-muted" htmlFor="name">
              Nome do Cliente
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-axium-border bg-axium-card px-3 py-2.5 text-white outline-none focus:border-white"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-axium-muted" htmlFor="slug">
              Slug (URL amigável, ex: cliente-01)
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              className="w-full rounded-lg border border-axium-border bg-axium-card px-3 py-2.5 text-white outline-none focus:border-white"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-axium-negative">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-white px-4 py-2 font-bold text-black transition hover:bg-axium-positive disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Conta'}
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
