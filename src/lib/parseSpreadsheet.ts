import * as XLSX from 'xlsx'

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

  return rawData
}

export function inferColumnTypes(rows: Record<string, unknown>[]): Record<string, string> {
  if (rows.length === 0) return {}

  const columns = Object.keys(rows[0])
  const types: Record<string, string> = {}

  for (const col of columns) {
    const values = rows.map((r) => r[col]).filter((v) => v !== '' && v !== undefined && v !== null)
    if (values.length === 0) {
      types[col] = 'text'
      continue
    }

    const numericCount = values.filter((v) => !isNaN(Number(v)) && v !== true && v !== false).length
    if (numericCount === values.length) {
      types[col] = 'numeric'
      continue
    }

    const dateCount = values.filter((v) => !isNaN(new Date(String(v)).getTime())).length
    if (dateCount === values.length) {
      types[col] = 'date'
      continue
    }

    types[col] = 'text'
  }

  return types
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
