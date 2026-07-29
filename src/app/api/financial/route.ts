import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { account_id, month, year, total_received, payment_status, expense_type, notes } = body

    if (!account_id || !month || !year || total_received === undefined || !payment_status || !expense_type) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: account_id, month, year, total_received, payment_status, expense_type' },
        { status: 400 }
      )
    }

    if (!['pago', 'pendente'].includes(payment_status)) {
      return NextResponse.json({ error: 'payment_status deve ser pago ou pendente' }, { status: 400 })
    }

    if (!['fixa', 'variavel'].includes(expense_type)) {
      return NextResponse.json({ error: 'expense_type deve ser fixa ou variavel' }, { status: 400 })
    }

    const periodReference = `${year}-${String(month).padStart(2, '0')}-01`

    const { data: entry, error } = await getSupabaseAdmin()
      .from('financial_entries')
      .insert({
        account_id,
        period_reference: periodReference,
        total_received,
        payment_status,
        expense_type,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao salvar entrada financeira: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Entrada financeira salva com sucesso', entry })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const accountId = searchParams.get('account_id')
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  if (!accountId) {
    return NextResponse.json({ error: 'account_id é obrigatório' }, { status: 400 })
  }

  let query = getSupabaseAdmin()
    .from('financial_entries')
    .select('*')
    .eq('account_id', accountId)

  if (month && year) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    query = query.eq('period_reference', start)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
