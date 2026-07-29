import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { generateWidgets } from '@/lib/metrics'

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
    widgets: [],
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
  if (month && year) {
    const key = `${parseInt(month, 10)}-${parseInt(year, 10)}`
    const uploadId = latestByPeriod.get(key)
    currentUploadIds = uploadId ? [uploadId] : []
  } else {
    const lastUpload = allUploads[allUploads.length - 1]
    const lastKey = `${lastUpload.period_month}-${lastUpload.period_year}`
    const latestId = latestByPeriod.get(lastKey)
    currentUploadIds = latestId ? [latestId] : []
  }

  if (currentUploadIds.length === 0) {
    return NextResponse.json(emptyResponse)
  }

  const { data: currentMetrics } = await sb
    .from('metrics')
    .select('campaign, date, investment, revenue, clicks, impressions, conversions, status, type')
    .in('upload_id', currentUploadIds)

  const { data: allMetrics } = await sb
    .from('metrics')
    .select('campaign, date, investment, revenue, clicks, impressions, conversions, status, type, upload_id')
    .in('upload_id', uniqueUploadIds)

  const currentRows = (currentMetrics || []) as unknown as Record<string, unknown>[]

  const metricsByPeriod = new Map<string, Record<string, unknown>[]>()
  if (allMetrics) {
    for (const row of allMetrics) {
      for (const upload of allUploads) {
        if (upload.id === row.upload_id) {
          const key = `${upload.period_month}-${upload.period_year}`
          if (!metricsByPeriod.has(key)) {
            metricsByPeriod.set(key, [])
          }
          const { upload_id, ...rest } = row
          metricsByPeriod.get(key)!.push(rest as Record<string, unknown>)
          break
        }
      }
    }
  }

  const allPeriodsData = Array.from(metricsByPeriod.entries()).map(([key, rows]) => {
    const [m, y] = key.split('-').map(Number)
    return {
      period: `${String(m).padStart(2, '0')}/${y}`,
      rows,
    }
  })

  allPeriodsData.sort((a, b) => {
    const [am, ay] = a.period.split('/').map(Number)
    const [bm, by] = b.period.split('/').map(Number)
    return ay !== by ? ay - by : am - bm
  })

  const widgets = generateWidgets(currentRows, allPeriodsData)

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
    widgets,
    availablePeriods: uniquePeriods,
    currentPeriod:
      month && year
        ? { month: parseInt(month, 10), year: parseInt(year, 10) }
        : uniquePeriods[uniquePeriods.length - 1] || null,
  })
}
