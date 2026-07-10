import * as XLSX from 'xlsx'

export interface SpreadsheetRow {
  campaign: string
  date: string
  investment: number
  revenue: number
  clicks: number
  impressions: number
  conversions: number
  status: string
  type: string
}

const COLUMN_MAP: Record<string, keyof SpreadsheetRow> = {
  'campanha': 'campaign',
  'campaign': 'campaign',
  'data': 'date',
  'date': 'date',
  'investimento': 'investment',
  'investment': 'investment',
  'receita': 'revenue',
  'revenue': 'revenue',
  'cliques': 'clicks',
  'clicks': 'clicks',
  'impressões': 'impressions',
  'impressoes': 'impressions',
  'impressions': 'impressions',
  'conversões': 'conversions',
  'conversoes': 'conversions',
  'conversions': 'conversions',
  'status': 'status',
  'tipo': 'type',
  'type': 'type',
}

const REQUIRED_COLUMNS: (keyof SpreadsheetRow)[] = [
  'campaign',
  'date',
  'investment',
  'revenue',
  'status',
  'type',
]

export function parseSpreadsheet(buffer: ArrayBuffer): SpreadsheetRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('Planilha vazia — nenhuma aba encontrada')
  }

  const sheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

  if (rawData.length === 0) {
    throw new Error('Planilha vazia — nenhuma linha de dados')
  }

  const headers = Object.keys(rawData[0])
  const mappedHeaders = headers.map((h) => {
    const key = h.toLowerCase().trim()
    return COLUMN_MAP[key] || null
  })

  const missing = REQUIRED_COLUMNS.filter((col) => !mappedHeaders.includes(col))
  if (missing.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes: ${missing
        .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
        .join(', ')}`
    )
  }

  const rows: SpreadsheetRow[] = rawData.map((row) => {
    const mapped: Record<string, unknown> = {}
    headers.forEach((header, i) => {
      const field = mappedHeaders[i]
      if (field) {
        mapped[field] = row[header]
      }
    })

    return {
      campaign: String(mapped.campaign ?? ''),
      date: formatDate(mapped.date),
      investment: parseNumber(mapped.investment),
      revenue: parseNumber(mapped.revenue),
      clicks: parseInteger(mapped.clicks),
      impressions: parseInteger(mapped.impressions),
      conversions: parseInteger(mapped.conversions),
      status: String(mapped.status ?? ''),
      type: String(mapped.type ?? ''),
    }
  })

  return rows
}

function formatDate(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'number') {
    // Excel serial date number
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
    }
  }
  const str = String(value).trim()
  // Try parsing various date formats
  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]
  }
  return str
}

function parseNumber(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0
  if (typeof value === 'number') return value
  const str = String(value).replace(/[R$\s.]/g, '').replace(',', '.')
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

function parseInteger(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0
  if (typeof value === 'number') return Math.round(value)
  const str = String(value).replace(/\D/g, '')
  const num = parseInt(str, 10)
  return isNaN(num) ? 0 : num
}
