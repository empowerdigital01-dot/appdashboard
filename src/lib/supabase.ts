import { createClient, SupabaseClient } from '@supabase/supabase-js'

const vars = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
}

function checkEnv(name: string, value: string | undefined): asserts value is string {
  if (!value) {
    const msg =
      `[Axium Dashboard] Variável de ambiente "${name}" não encontrada ou está vazia.\n` +
      `Verifique se o arquivo .env.local existe na raiz do projeto e contém:\n\n` +
      `  ${name}=<seu_valor>\n\n` +
      `As chaves estão em: Projeto Supabase → Settings → API`
    console.error(msg)
    throw new Error(`Missing env: ${name}`)
  }
}

let _admin: SupabaseClient | null = null
let _client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    checkEnv('NEXT_PUBLIC_SUPABASE_URL', vars.url)
    checkEnv('SUPABASE_SERVICE_ROLE_KEY', vars.serviceKey)
    _admin = createClient(vars.url, vars.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    checkEnv('NEXT_PUBLIC_SUPABASE_URL', vars.url)
    checkEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', vars.anonKey)
    _client = createClient(vars.url, vars.anonKey, {
      auth: { autoRefreshToken: true, persistSession: true },
    })
  }
  return _client
}
