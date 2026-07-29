import * as XLSX from 'xlsx'

export interface ParsedRow {
  campaign_name: string
  report_date: string
  spend: number
  raw_data: Record<string, unknown>
}

function findHeaderIndex(
  headers: string[],
  patterns: string[]
): number {
  for (const h of headers) {
    const lower = h.toLowerCase().trim()
    for (const p of patterns) {
      if (lower.includes(p)) return headers.indexOf(h)
    }
  }
  return -1
}

const DATE_PATTERNS = [
  'início dos relatórios', 'inicio dos relatorios',
  'reporting starts', 'data de início',
  'data', 'date', 'start',
  'início', 'inicio',
]

const CAMPAIGN_PATTERNS = [
  'nome do anúncio', 'nome do anuncio',
  'nome da campanha',
  'campanha', 'campaign',
  'ad name', 'campaign name',
  'anúncio', 'anuncio',
]

const SPEND_PATTERNS = [
  'valor usado (brl)', 'valor usado',
  'amount spent (brl)', 'amount spent',
  'investimento', 'investment',
  'spend', 'custo',
  'gasto',
]

export function parseSpreadsheet(buffer: ArrayBuffer): ParsedRow[] {
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
  const dateIdx = findHeaderIndex(headers, DATE_PATTERNS)
  const campaignIdx = findHeaderIndex(headers, CAMPAIGN_PATTERNS)
  const spendIdx = findHeaderIndex(headers, SPEND_PATTERNS)

  const notFound: string[] = []
  if (dateIdx === -1) notFound.push('data')
  if (campaignIdx === -1) notFound.push('nome da campanha/anúncio')
  if (spendIdx === -1) notFound.push('investimento/valor usado')

  if (notFound.length > 0) {
    throw new Error(
      `Não foi possível identificar as colunas obrigatórias (${notFound.join(', ')}) na planilha.\n` +
      `Cabeçalhos encontrados: ${headers.join(' | ')}`
    )
  }

  return rawData.map((row) => {
    const rawRow: Record<string, unknown> = {}
    for (const h of headers) {
      rawRow[h] = row[h]
    }

    return {
      campaign_name: String(row[headers[campaignIdx]] ?? '').trim(),
      report_date: parseDate(row[headers[dateIdx]]),
      spend: parseNumber(row[headers[spendIdx]]),
      raw_data: rawRow,
    }
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
