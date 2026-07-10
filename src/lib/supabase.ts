import { createClient, SupabaseClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    const list = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
      .filter((n) => !process.env[n] || process.env[n]!.trim() === '')
      .map((n) => `  - ${n}`)
      .join('\n')

    throw new Error(
      `\n` +
      `┌─────────────────────────────────────────────────────────────────┐\n` +
      `│  [Axium Dashboard] Variáveis de ambiente ausentes ou vazias    │\n` +
      `├─────────────────────────────────────────────────────────────────┤\n` +
      `│                                                                 │\n` +
      `│  Faltando:                                                      │\n` +
      `${list}\n` +
      `│                                                                 │\n` +
      `│  1. Verifique se o arquivo .env.local existe na raiz do projeto │\n` +
      `│  2. As chaves estão em: Supabase → Project Settings → API      │\n` +
      `│  3. Depois de editar o .env.local, REINICIE o servidor:        │\n` +
      `│                                                                 │\n` +
      `│     Ctrl+C e rode novamente: npm run dev                        │\n` +
      `│                                                                 │\n` +
      `│  (Variáveis NEXT_PUBLIC_* só são lidas na inicialização do Next)│\n` +
      `└─────────────────────────────────────────────────────────────────┘\n`
    )
  }
  return value
}

let _admin: SupabaseClient | null = null
let _client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
    _admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    _client = createClient(url, anonKey, {
      auth: { autoRefreshToken: true, persistSession: true },
    })
  }
  return _client
}
