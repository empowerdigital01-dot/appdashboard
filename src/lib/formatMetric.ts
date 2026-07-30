export type MetricFormat = 'currency' | 'percentage' | 'count'

export function detectMetricFormat(fieldName: string): MetricFormat {
  const lower = fieldName.toLowerCase().trim()

  if (lower.includes('ctr') || lower.includes('%')) return 'percentage'

  if (lower.includes('custo por') || lower.includes('valor')) return 'currency'

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
