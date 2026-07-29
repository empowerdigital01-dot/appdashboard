import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { parseSpreadsheet } from '@/lib/parseSpreadsheet'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const accountId = formData.get('account_id') as string | null
    const periodMonth = formData.get('period_month') as string | null
    const periodYear = formData.get('period_year') as string | null

    if (!file || !accountId || !periodMonth || !periodYear) {
      return NextResponse.json(
        { error: 'Arquivo, account_id, period_month e period_year são obrigatórios' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Limite: 10MB' },
        { status: 400 }
      )
    }

    const { data: account, error: accountError } = await getSupabaseAdmin()
      .from('accounts')
      .select('id')
      .eq('id', accountId)
      .maybeSingle()

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      )
    }

    const buffer = await file.arrayBuffer()
    let rows
    try {
      rows = parseSpreadsheet(buffer)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao processar planilha'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Delete existing upload for this period (replace old data)
    await getSupabaseAdmin()
      .from('uploads')
      .delete()
      .eq('account_id', accountId)
      .eq('period_month', parseInt(periodMonth, 10))
      .eq('period_year', parseInt(periodYear, 10))

    const { data: upload, error: uploadError } = await getSupabaseAdmin()
      .from('uploads')
      .insert({
        account_id: accountId,
        filename: file.name,
        period_month: parseInt(periodMonth, 10),
        period_year: parseInt(periodYear, 10),
      })
      .select()
      .single()

    if (uploadError || !upload) {
      return NextResponse.json(
        { error: 'Erro ao criar registro de upload' },
        { status: 500 }
      )
    }

    const metricsData = rows.map((row: Record<string, unknown>) => ({
      upload_id: upload.id,
      campaign: row.campaign ?? '',
      date: row.date ?? '',
      investment: parseFloat(String(row.investment ?? 0)),
      revenue: parseFloat(String(row.revenue ?? 0)),
      clicks: parseInt(String(row.clicks ?? 0), 10),
      impressions: parseInt(String(row.impressions ?? 0), 10),
      conversions: parseInt(String(row.conversions ?? 0), 10),
      status: row.status ?? '',
      type: row.type ?? '',
    }))

    const { error: metricsError } = await getSupabaseAdmin()
      .from('metrics')
      .insert(metricsData)

    if (metricsError) {
      await getSupabaseAdmin().from('uploads').delete().eq('id', upload.id)
      return NextResponse.json(
        { error: 'Erro ao salvar métricas: ' + metricsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Planilha importada com sucesso',
      upload_id: upload.id,
      rows_imported: metricsData.length,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
