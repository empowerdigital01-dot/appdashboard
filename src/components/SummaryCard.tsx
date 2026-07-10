interface SummaryCardProps {
  title: string
  value: string
  color: 'positive' | 'negative' | 'attention' | 'neutral' | 'white'
}

const colorMap = {
  positive: 'text-axium-positive',
  negative: 'text-axium-negative',
  attention: 'text-axium-attention',
  neutral: 'text-axium-neutral',
  white: 'text-white',
}

export default function SummaryCard({ title, value, color }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-axium-border bg-axium-card p-3 sm:p-5">
      <p className="mb-1 text-xs text-axium-muted sm:text-sm">{title}</p>
      <p className={`text-lg font-bold sm:text-2xl ${colorMap[color]}`}>{value}</p>
    </div>
  )
}
