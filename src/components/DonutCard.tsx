import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface DonutData {
  name: string
  value: number
}

interface DonutCardProps {
  title: string
  data: DonutData[]
  colors: string[]
  formatValue?: (v: number) => string
}

const DEFAULT_COLORS = ['#D4D4D4', '#5C5C5C', '#A0A0A0', '#B8B8B8', '#2A2A2A']

export default function DonutCard({
  title,
  data,
  colors = DEFAULT_COLORS,
  formatValue = (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
}: DonutCardProps) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="rounded-xl border border-axium-border bg-axium-card p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-semibold text-axium-muted">{title}</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="h-28 w-28 shrink-0 sm:h-32 sm:w-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={48}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, index) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
            return (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-axium-muted">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{formatValue(item.value)}</p>
                  <p className="text-xs text-axium-neutral">{pct}%</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
