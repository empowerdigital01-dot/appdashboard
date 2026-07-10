import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function requireAdminAuth(
  req: NextRequest
): Promise<{ authenticated: boolean; error?: Response }> {
  const supabase = getSupabaseAdmin()
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return {
      authenticated: false,
      error: Response.json(
        { error: 'Não autenticado' },
        { status: 401 }
      ),
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return {
      authenticated: false,
      error: Response.json(
        { error: 'Sessão expirada' },
        { status: 401 }
      ),
    }
  }

  return { authenticated: true }
}
