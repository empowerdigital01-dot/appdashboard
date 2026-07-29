export type MetricFormat = 'currency' | 'percentage' | 'count'

const MONETARY_PATTERNS = [
  'custo por', 'valor usado', 'valor', 'investimento',
  'spend', 'amount spent', 'gasto', 'custo', 'receita',
  'revenue', 'budget', 'orcamento', 'orçamento',
]

const PERCENTAGE_PATTERNS = [
  'ctr', '%', 'cpm', 'taxa', 'rate', 'ratio',
  'frequencia', 'frequência', 'frequency',
]

export function detectMetricFormat(fieldName: string): MetricFormat {
  const lower = fieldName.toLowerCase().trim()

  for (const p of PERCENTAGE_PATTERNS) {
    if (lower.includes(p)) return 'percentage'
  }

  for (const p of MONETARY_PATTERNS) {
    if (lower.includes(p)) return 'currency'
  }

  return 'count'
}

export function formatMetricValue(value: number, format: MetricFormat): string {
  switch (format) {
    case 'currency':
      return `R$ ${value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    case 'percentage':
      return `${value.toFixed(2).replace('.', ',')}%`
    case 'count':
      return value.toLocaleString('pt-BR')
  }
}
