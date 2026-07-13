import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params

  const { data, error } = await getSupabaseAdmin()
    .from('accounts')
    .update({ access_token: crypto.randomUUID() })
    .eq('id', accountId)
    .select('access_token')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: 'Erro ao regenerar token' },
      { status: 500 }
    )
  }

  return NextResponse.json({ access_token: data.access_token })
}
