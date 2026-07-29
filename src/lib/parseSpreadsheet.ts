import * as XLSX from 'xlsx'

const COLUMN_MAP: Record<string, string> = {
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

const REQUIRED_COLUMNS = ['campanha', 'data', 'investimento', 'receita', 'status', 'tipo']

export function parseSpreadsheet(buffer: ArrayBuffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('Planilha vazia — nenhuma aba encontrada')
  }

  const sheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (rawData.length === 0) {
    throw new Error('Planilha vazia — nenhuma linha de dados')
  }

  const headers = Object.keys(rawData[0])
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim())
  const mappedHeaders = normalizedHeaders.map((h) => COLUMN_MAP[h] || null)

  const missing = REQUIRED_COLUMNS.filter((col) => !normalizedHeaders.includes(col))
  if (missing.length > 0) {
    throw new Error(
      `Colunas obrigatórias ausentes: ${missing
        .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
        .join(', ')}`
    )
  }

  return rawData.map((row) => {
    const mapped: Record<string, unknown> = {}
    headers.forEach((header, i) => {
      const field = mappedHeaders[i]
      if (field) {
        mapped[field] = row[header]
      }
    })
    return mapped
  })
}

export function parseNumber(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0
  if (typeof value === 'number') return value
  const str = String(value).replace(/[R$\s.]/g, '').replace(',', '.')
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

export function parseDate(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value)
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
    }
  }
  const str = String(value).trim()
  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]
  }
  return str
}
