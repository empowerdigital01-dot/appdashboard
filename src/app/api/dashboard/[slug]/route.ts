import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { computeFinancialSummary, computeTopCampaigns, computeEvolution } from '@/lib/metrics'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const sb = getSupabaseAdmin()

  const { data: account } = await sb
    .from('accounts')
    .select('id')
    .eq('slug', slug)
    .eq('access_token', token)
    .single()

  if (!account) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const month = req.nextUrl.searchParams.get('month')
  const year = req.nextUrl.searchParams.get('year')

  const emptyResponse = {
    financial: null,
    topCampaigns: [],
    evolution: [],
    rawDataColumns: [],
    campaignMetrics: [],
    availablePeriods: [],
    currentPeriod: null,
  }

  const { data: allUploads } = await sb
    .from('uploads')
    .select('id, period_month, period_year')
    .eq('account_id', account.id)
    .order('period_year', { ascending: true })
    .order('period_month', { ascending: true })

  if (!allUploads || allUploads.length === 0) {
    return NextResponse.json(emptyResponse)
  }

  const latestByPeriod = new Map<string, string>()
  for (const upload of allUploads) {
    const key = `${upload.period_month}-${upload.period_year}`
    latestByPeriod.set(key, upload.id)
  }
  const uniqueUploadIds = Array.from(latestByPeriod.values())

  let currentUploadIds: string[]
  let currentPeriodMonth: number
  let currentPeriodYear: number
  if (month && year) {
    currentPeriodMonth = parseInt(month, 10)
    currentPeriodYear = parseInt(year, 10)
    const key = `${currentPeriodMonth}-${currentPeriodYear}`
    const uploadId = latestByPeriod.get(key)
    currentUploadIds = uploadId ? [uploadId] : []
  } else {
    const lastUpload = allUploads[allUploads.length - 1]
    currentPeriodMonth = lastUpload.period_month
    currentPeriodYear = lastUpload.period_year
    const lastKey = `${currentPeriodMonth}-${currentPeriodYear}`
    const latestId = latestByPeriod.get(lastKey)
    currentUploadIds = latestId ? [latestId] : []
  }

  if (currentUploadIds.length === 0) {
    return NextResponse.json(emptyResponse)
  }

  // Fetch current period metrics
  const { data: currentMetrics } = await sb
    .from('metrics')
    .select('campaign_name, spend, raw_data')
    .in('upload_id', currentUploadIds)

  // Fetch all periods metrics for evolution
  const { data: allMetrics } = await sb
    .from('metrics')
    .select('campaign_name, spend, raw_data, upload_id')
    .in('upload_id', uniqueUploadIds)

  // Fetch financial entries for current period
  const { data: financialEntries } = await sb
    .from('financial_entries')
    .select('total_received, payment_status, expense_type')
    .eq('account_id', account.id)
    .eq('period_reference_month', currentPeriodMonth)
    .eq('period_reference_year', currentPeriodYear)

  // Compute total spend from current metrics
  const totalSpend = (currentMetrics || []).reduce(
    (sum, row) => sum + (parseFloat(row.spend) || 0),
    0
  )

  // Compute financial summary
  const financial =
    financialEntries && financialEntries.length > 0
      ? computeFinancialSummary(financialEntries, totalSpend)
      : {
          totalSpend,
          totalReceived: 0,
          balance: -totalSpend,
          totalPendente: 0,
          statusDistribution: [],
          typeDistribution: [],
        }

  // Top 5 campaigns by spend
  const topCampaigns = computeTopCampaigns(currentMetrics || [])

  // Group all metrics by period for evolution
  const metricsByPeriod = new Map<string, { spend: number }[]>()
  if (allMetrics) {
    for (const row of allMetrics) {
      for (const upload of allUploads) {
        if (upload.id === row.upload_id) {
          const key = `${upload.period_month}-${upload.period_year}`
          if (!metricsByPeriod.has(key)) metricsByPeriod.set(key, [])
          metricsByPeriod.get(key)!.push({ spend: parseFloat(row.spend) || 0 })
          break
        }
      }
    }
  }

  const allPeriodsData = Array.from(metricsByPeriod.entries())
    .map(([key, rows]) => {
      const [m, y] = key.split('-').map(Number)
      return { period: `${String(m).padStart(2, '0')}/${y}`, rows }
    })
    .sort((a, b) => {
      const [am, ay] = a.period.split('/').map(Number)
      const [bm, by] = b.period.split('/').map(Number)
      return ay !== by ? ay - by : am - bm
    })

  const evolution = computeEvolution(allPeriodsData)

  // CampaignMetrics: raw_data rows for the "Métricas de Campanha" section
  const rawDataColumns: string[] = []
  const campaignMetrics: Record<string, unknown>[] = []
  if (currentMetrics && currentMetrics.length > 0) {
    const EXCLUDED_COLS = new Set(['campaign_name', 'report_date', 'spend'])
    const firstRow = currentMetrics[0].raw_data as Record<string, unknown> | null
    if (firstRow) {
      for (const col of Object.keys(firstRow)) {
        if (!EXCLUDED_COLS.has(col)) rawDataColumns.push(col)
      }
    }
    for (const row of currentMetrics) {
      const rd = (row.raw_data as Record<string, unknown>) || {}
      const entry: Record<string, unknown> = {}
      for (const col of rawDataColumns) {
        entry[col] = rd[col]
      }
      campaignMetrics.push(entry)
    }
  }

  // Build available periods
  const uploadPeriodMap = new Map<string, { month: number; year: number }>()
  for (const upload of allUploads) {
    const key = `${upload.period_month}-${upload.period_year}`
    if (!uploadPeriodMap.has(key)) {
      uploadPeriodMap.set(key, { month: upload.period_month, year: upload.period_year })
    }
  }

  const uniquePeriods = Array.from(uploadPeriodMap.entries())
    .sort((a, b) => {
      const [am, ay] = a[0].split('-').map(Number)
      const [bm, by] = b[0].split('-').map(Number)
      return ay !== by ? ay - by : am - bm
    })
    .map(([, { month: m, year: y }]) => ({
      month: m,
      year: y,
      label: `${String(m).padStart(2, '0')}/${y}`,
    }))

  return NextResponse.json({
    financial,
    topCampaigns,
    evolution,
    rawDataColumns,
    campaignMetrics,
    availablePeriods: uniquePeriods,
    currentPeriod:
      month && year
        ? { month: currentPeriodMonth, year: currentPeriodYear }
        : uniquePeriods[uniquePeriods.length - 1] || null,
  })
}
