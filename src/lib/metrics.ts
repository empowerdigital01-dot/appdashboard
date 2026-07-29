import { parseNumber } from './parseSpreadsheet'

const DONUT_COLORS = ['#D4D4D4', '#5C5C5C', '#A0A0A0', '#B8B8B8', '#2A2A2A', '#7A7A7A', '#E0E0E0', '#3A3A3A', '#C0C0C0', '#909090', '#1A1A1A', '#F0F0F0']

interface SummaryWidget {
  type: 'summary'
  title: string
  value: number
  format: 'currency' | 'number'
  color: 'positive' | 'negative' | 'neutral'
}

interface DonutWidget {
  type: 'donut'
  title: string
  data: { name: string; value: number }[]
  colors: string[]
}

interface TopListWidget {
  type: 'top-list'
  title: string
  data: { name: string; value: number }[]
  format: 'currency' | 'number'
}

interface EvolutionWidget {
  type: 'evolution'
  title: string
  data: Record<string, string | number>[]
  series: { dataKey: string; name: string; color: string }[]
}

export type Widget = SummaryWidget | DonutWidget | TopListWidget | EvolutionWidget

function detectNumericColumns(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return []
  const candidates = Object.keys(rows[0])
  return candidates.filter((col) => {
    const vals = rows.map((r) => r[col]).filter((v) => v !== '' && v !== undefined && v !== null)
    return vals.length > 0 && vals.every((v) => !isNaN(Number(v)) && v !== true && v !== false)
  })
}

function detectDateColumns(rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return []
  const candidates = Object.keys(rows[0])
  return candidates.filter((col) => {
    const vals = rows.map((r) => r[col]).filter((v) => v !== '' && v !== undefined && v !== null)
    if (vals.length === 0) return false
    return vals.every((v) => !isNaN(new Date(String(v)).getTime()))
  })
}

function detectTextColumns(rows: Record<string, unknown>[]): string[] {
  const numericCols = detectNumericColumns(rows)
  const dateCols = detectDateColumns(rows)
  return Object.keys(rows[0]).filter(
    (col) => !numericCols.includes(col) && !dateCols.includes(col)
  )
}

function getUniqueValues(rows: Record<string, unknown>[], col: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const val = String(r[col] ?? '').trim()
    if (!val) continue
    counts.set(val, (counts.get(val) || 0) + 1)
  }
  return counts
}

function computeColumnStats(rows: Record<string, unknown>[], numericCols: string[]) {
  const stats: Record<string, { sum: number; avg: number; min: number; max: number }> = {}
  for (const col of numericCols) {
    const vals = rows.map((r) => parseNumber(r[col]))
    const sum = vals.reduce((a, b) => a + b, 0)
    const valid = vals.filter((v) => v !== 0)
    stats[col] = {
      sum,
      avg: vals.length > 0 ? sum / vals.length : 0,
      min: valid.length > 0 ? Math.min(...valid) : 0,
      max: valid.length > 0 ? Math.max(...valid) : 0,
    }
  }
  return stats
}

const EVOLUTION_COLORS = ['#D4D4D4', '#5C5C5C', '#A0A0A0', '#B8B8B8', '#2A2A2A', '#7A7A7A']

export function generateWidgets(
  currentRows: Record<string, unknown>[],
  allPeriods?: { period: string; rows: Record<string, unknown>[] }[]
): Widget[] {
  const widgets: Widget[] = []
  if (currentRows.length === 0) return widgets

  const numericCols = detectNumericColumns(currentRows)
  const textCols = detectTextColumns(currentRows)

  // 1. Summary cards for numeric columns
  const stats = computeColumnStats(currentRows, numericCols)
  for (const col of numericCols) {
    const s = stats[col]
    let color: 'positive' | 'negative' | 'neutral' = 'neutral'
    if (s.sum > 0) color = 'positive'
    else if (s.sum < 0) color = 'negative'

    widgets.push({
      type: 'summary',
      title: col,
      value: s.sum,
      format: 'currency',
      color,
    })
  }

  // 2. Donut charts for categorical columns (text cols with ≤ 15 unique values)
  for (const col of textCols) {
    const uniqueVals = getUniqueValues(currentRows, col)
    if (uniqueVals.size <= 1) continue
    if (uniqueVals.size > 15) continue

    const total = Array.from(uniqueVals.values()).reduce((a, b) => a + b, 0)
    const slices = Array.from(uniqueVals.entries())
      .map(([name, count]) => ({
        name,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)

    widgets.push({
      type: 'donut',
      title: col,
      data: slices,
      colors: DONUT_COLORS,
    })
  }

  // 3. Top-N lists for text columns paired with numeric columns
  // 3a. First try: find text columns with many unique values (potential grouping keys)
  const multiValueCols = textCols.filter((col) => {
    const uniqueVals = getUniqueValues(currentRows, col)
    return uniqueVals.size >= 2
  })

  for (const groupCol of multiValueCols) {
    const uniqueVals = getUniqueValues(currentRows, groupCol)
    if (uniqueVals.size <= 1) continue
    if (uniqueVals.size <= 15) continue

    for (const numCol of numericCols) {
      const groups = new Map<string, number>()
      for (const r of currentRows) {
        const key = String(r[groupCol] ?? '').trim()
        if (!key) continue
        groups.set(key, (groups.get(key) || 0) + parseNumber(r[numCol]))
      }

      const topItems = Array.from(groups.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }))

      if (topItems.length >= 2) {
        widgets.push({
          type: 'top-list',
          title: `Top ${groupCol} por ${numCol}`,
          data: topItems,
          format: 'currency',
        })
      }
      break
    }
  }

  // 4. Evolution chart across periods
  if (allPeriods && allPeriods.length >= 1 && numericCols.length > 0) {
    const allNumericCols = new Set<string>(numericCols)
    for (const p of allPeriods) {
      for (const col of detectNumericColumns(p.rows)) {
        allNumericCols.add(col)
      }
    }

    const colsToShow = Array.from(allNumericCols).slice(0, 6)

    const evolutionData = allPeriods.map((p) => {
      const point: Record<string, string | number> = { period: p.period }
      const pStats = computeColumnStats(p.rows, colsToShow)
      for (const col of colsToShow) {
        point[col] = pStats[col]?.sum ?? 0
      }
      return point
    })

    const series = colsToShow.map((col, i) => ({
      dataKey: col,
      name: col,
      color: EVOLUTION_COLORS[i % EVOLUTION_COLORS.length],
    }))

    widgets.push({
      type: 'evolution',
      title: 'Evolução por Período',
      data: evolutionData,
      series,
    })
  }

  return widgets
}
