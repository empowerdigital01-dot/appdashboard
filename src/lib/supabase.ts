import { createClient, SupabaseClient } from '@supabase/supabase-js'

function validateServerEnvVars(): { url: string; serviceKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const missing: string[] = []

  if (!url || url.trim() === '') missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!serviceKey || serviceKey.trim() === '') missing.push('SUPABASE_SERVICE_ROLE_KEY')

  if (missing.length > 0) {
    throw new Error(
      `[Axium Dashboard] Variáveis de servidor ausentes: ${missing.join(', ')}. ` +
      `Verifique o .env.local e reinicie o servidor (npm run dev).`
    )
  }

  return { url: url!, serviceKey: serviceKey! }
}

let _admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const { url, serviceKey } = validateServerEnvVars()
    _admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}
