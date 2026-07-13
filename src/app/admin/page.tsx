'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Account {
  id: string
  name: string
  slug: string
  access_token: string
  created_at: string
}

export default function AdminPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/admin/accounts')
    if (res.ok) {
      const data = await res.json()
      setAccounts(data)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  function copyLink(slug: string, token: string) {
    const link = `${window.location.origin}/d/${slug}/${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-axium-bg p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold text-white sm:text-2xl">Contas</h1>
          <Link
            href="/admin/novo"
            className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-axium-positive"
          >
            Nova Conta
          </Link>
        </div>

        <div className="space-y-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-xl border border-axium-border bg-axium-card p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{acc.name}</h2>
                  <p className="text-sm text-axium-muted">/{acc.slug}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/d/${acc.slug}/${acc.access_token}`}
                    className="w-full rounded border border-axium-border bg-axium-bg px-2 py-1 text-xs text-axium-muted sm:w-72"
                  />
                  <button
                    onClick={() => copyLink(acc.slug, acc.access_token)}
                    className="shrink-0 rounded bg-axium-border px-3 py-1 text-xs text-white transition hover:bg-axium-negative"
                  >
                    {copiedId === acc.access_token ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/admin/${acc.id}/upload`}
                  className="rounded bg-axium-border px-3 py-1 text-xs text-white transition hover:bg-axium-negative"
                >
                  Upload
                </Link>
                <Link
                  href={`/admin/${acc.id}`}
                  className="rounded bg-axium-border px-3 py-1 text-xs text-white transition hover:bg-axium-negative"
                >
                  Detalhes
                </Link>
              </div>
            </div>
          ))}

          {accounts.length === 0 && (
            <p className="text-center text-axium-neutral">
              Nenhuma conta cadastrada.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
