import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAdminAuth } from '@/lib/apiAuth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const auth = await requireAdminAuth(req)
  if (!auth.authenticated) return auth.error!

  const { accountId } = await params

  const { data, error } = await getSupabaseAdmin()
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
  }

  return NextResponse.json(data)
}
