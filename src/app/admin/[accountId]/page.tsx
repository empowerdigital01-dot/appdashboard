'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'

interface Account {
  id: string
  name: string
  slug: string
  access_token: string
  created_at: string
}

export default function AccountDetailPage() {
  const { accountId } = useParams()
  const router = useRouter()
  const [account, setAccount] = useState<Account | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getSupabaseClient().auth.getSession()
        const token = data.session?.access_token
        if (!token) {
          router.push('/admin/login')
          return
        }

        const res = await fetch(`/api/admin/accounts/${accountId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          setFetchError(true)
          return
        }

        const json = await res.json()
        if (json.error) {
          setFetchError(true)
          return
        }

        setAccount(json)
      } catch {
        setFetchError(true)
      }
    }
    load()
  }, [accountId, router])

  async function regenerateToken() {
    if (!confirm('Tem certeza? O link anterior será invalidado.')) return
    setRegenerating(true)

    try {
      const { data } = await getSupabaseClient().auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        router.push('/admin/login')
        return
      }

      const res = await fetch(`/api/admin/accounts/${accountId}/regenerate-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAccount((prev) => prev ? { ...prev, access_token: data.access_token } : null)
      }
    } finally {
      setRegenerating(false)
    }
  }

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-axium-bg px-4">
        <div className="text-center">
          <p className="mb-4 text-axium-muted">Conta não encontrada ou erro ao carregar.</p>
          <button
            onClick={() => router.push('/admin')}
            className="rounded-lg border border-axium-border px-4 py-2 text-sm text-axium-muted transition hover:text-white"
          >
            ← Voltar
          </button>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-axium-bg">
        <p className="text-axium-muted">Carregando...</p>
      </div>
    )
  }

  const dashboardLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/d/${account.slug}/${account.access_token}`

  function copyLink() {
    navigator.clipboard.writeText(dashboardLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-axium-bg p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-xl font-bold text-white sm:text-2xl">{account.name}</h1>

        <div className="space-y-4 rounded-xl border border-axium-border bg-axium-card p-4 sm:p-6">
          <div>
            <p className="text-sm text-axium-muted">Slug</p>
            <p className="text-white">/{account.slug}</p>
          </div>

          <div>
            <p className="text-sm text-axium-muted">Link do Dashboard</p>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                readOnly
                value={dashboardLink}
                className="flex-1 rounded border border-axium-border bg-axium-bg px-3 py-2 text-sm text-axium-muted"
              />
              <button
                onClick={copyLink}
                className="shrink-0 rounded bg-axium-border px-4 py-2 text-sm text-white hover:bg-axium-negative"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={regenerateToken}
              disabled={regenerating}
              className="rounded-lg bg-axium-negative px-4 py-2 text-sm font-bold text-white transition hover:bg-axium-border disabled:opacity-50"
            >
              {regenerating ? 'Regenerando...' : 'Regenerar Link'}
            </button>
            <p className="mt-2 text-xs text-axium-neutral">
              Isso gera um novo token e invalida o link anterior.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/admin')}
          className="mt-6 rounded-lg border border-axium-border px-4 py-2 text-sm text-axium-muted transition hover:text-white"
        >
          ← Voltar
        </button>
      </div>
    </div>
  )
}
