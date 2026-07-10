import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { calculateMetrics } from '@/lib/metrics'

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
    metrics: {
      saldoPeriodo: 0,
      totalRecebido: 0,
      totalGasto: 0,
      totalPago: 0,
      totalPendente: 0,
      roas: 0,
      fixasTotal: 0,
      variaveisTotal: 0,
      statusCounts: {},
      statusRevenue: {},
      topExpenses: [],
      evolutionData: [],
      donutReceitasDespesas: [],
      donutFixasVariaveis: [],
      donutStatus: [],
    },
    availablePeriods: [],
    currentPeriod: null,
  }

  // Fetch ALL uploads for this account once
  const { data: allUploads } = await sb
    .from('uploads')
    .select('id, period_month, period_year')
    .eq('account_id', account.id)
    .order('period_year', { ascending: true })
    .order('period_month', { ascending: true })

  if (!allUploads || allUploads.length === 0) {
    return NextResponse.json(emptyResponse)
  }

  // Deduplicate: keep only the latest upload per period
  const latestByPeriod = new Map<string, string>()
  for (const upload of allUploads) {
    const key = `${upload.period_month}-${upload.period_year}`
    latestByPeriod.set(key, upload.id)
  }
  const uniqueUploadIds = Array.from(latestByPeriod.values())

  // Determine current period upload IDs (filtered or latest)
  let currentUploadIds: string[]
  if (month && year) {
    const key = `${parseInt(month, 10)}-${parseInt(year, 10)}`
    const uploadId = latestByPeriod.get(key)
    currentUploadIds = uploadId ? [uploadId] : []
  } else {
    // Default to the latest period
    const lastUpload = allUploads[allUploads.length - 1]
    const lastKey = `${lastUpload.period_month}-${lastUpload.period_year}`
    const latestId = latestByPeriod.get(lastKey)
    currentUploadIds = latestId ? [latestId] : []
  }

  if (currentUploadIds.length === 0) {
    return NextResponse.json(emptyResponse)
  }

  // Fetch current period metrics
  const { data: currentMetrics } = await sb
    .from('metrics')
    .select('*')
    .in('upload_id', currentUploadIds)

  // Fetch all metrics for evolution data in a single query using IN
  const { data: allMetrics } = await sb
    .from('metrics')
    .select('*')
    .in('upload_id', uniqueUploadIds)

  // Build period lookup for evolution data
  const uploadPeriodMap = new Map<string, { month: number; year: number }>()
  for (const upload of allUploads) {
    const key = `${upload.period_month}-${upload.period_year}`
    if (!uploadPeriodMap.has(key)) {
      uploadPeriodMap.set(key, { month: upload.period_month, year: upload.period_year })
    }
  }

  // Group metrics by period for evolution
  const metricsByPeriod = new Map<string, typeof currentMetrics>()
  if (allMetrics) {
    for (const row of allMetrics) {
      // Find which upload this metric belongs to by checking upload IDs
      for (const upload of allUploads) {
        if (upload.id === row.upload_id) {
          const key = `${upload.period_month}-${upload.period_year}`
          if (!metricsByPeriod.has(key)) {
            metricsByPeriod.set(key, [])
          }
          metricsByPeriod.get(key)!.push(row)
          break
        }
      }
    }
  }

  const allPeriodsData = Array.from(metricsByPeriod.entries()).map(
    ([key, rows]) => {
      const [m, y] = key.split('-').map(Number)
      return {
        period: `${String(m).padStart(2, '0')}/${y}`,
        rows: rows || [],
      }
    }
  )

  // Sort evolution data chronologically
  allPeriodsData.sort((a, b) => {
    const [am, ay] = a.period.split('/').map(Number)
    const [bm, by] = b.period.split('/').map(Number)
    return ay !== by ? ay - by : am - bm
  })

  const result = calculateMetrics(currentMetrics || [], allPeriodsData)

  // Build unique periods from the deduplicated map
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
    metrics: result,
    availablePeriods: uniquePeriods,
    currentPeriod:
      month && year
        ? { month: parseInt(month, 10), year: parseInt(year, 10) }
        : uniquePeriods[uniquePeriods.length - 1] || null,
  })
}
