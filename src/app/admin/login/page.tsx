'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await getSupabaseClient().auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (authError) {
      setError('E-mail ou senha inválidos')
      return
    }

    router.push('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-axium-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-axium-border bg-axium-card p-6 sm:p-8">
        <h1 className="mb-6 text-center text-xl font-bold text-white sm:text-2xl">
          Axium Dashboard
        </h1>
        <p className="mb-6 text-center text-sm text-axium-muted">Admin — Login</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-axium-muted" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-axium-border bg-axium-bg px-3 py-2.5 text-white placeholder-axium-neutral outline-none focus:border-white"
              placeholder="admin@exemplo.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-axium-muted" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-axium-border bg-axium-bg px-3 py-2.5 text-white placeholder-axium-neutral outline-none focus:border-white"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-axium-negative">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-2.5 font-bold text-black transition hover:bg-axium-positive disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
