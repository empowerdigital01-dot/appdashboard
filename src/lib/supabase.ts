import { createClient, SupabaseClient } from '@supabase/supabase-js'

const ENV_VARS = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
} as const

function validateEnvVars(): void {
  const missing: string[] = []

  for (const [name, value] of Object.entries(ENV_VARS)) {
    if (!value || value.trim() === '') {
      missing.push(name)
    }
  }

  if (missing.length > 0) {
    const list = missing.map((n) => `  - ${n}`).join('\n')
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
}

validateEnvVars()

let _admin: SupabaseClient | null = null
let _client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(
      ENV_VARS.NEXT_PUBLIC_SUPABASE_URL!,
      ENV_VARS.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _admin
}

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      ENV_VARS.NEXT_PUBLIC_SUPABASE_URL!,
      ENV_VARS.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: true, persistSession: true } }
    )
  }
  return _client
}
