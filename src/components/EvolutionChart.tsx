import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface EvolutionData {
  period: string
  investment: number
  revenue: number
}

interface EvolutionChartProps {
  data: EvolutionData[]
}

export default function EvolutionChart({ data }: EvolutionChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-axium-border bg-axium-card p-4 sm:p-5">
        <h3 className="mb-4 text-sm font-semibold text-axium-muted">
          Evolução Mensal
        </h3>
        <p className="text-sm text-axium-neutral">Nenhum período anterior disponível</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-axium-border bg-axium-card p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-semibold text-axium-muted">
        Evolução Mensal
      </h3>
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis
              dataKey="period"
              stroke="#9A9A9A"
              tick={{ fill: '#9A9A9A', fontSize: 10 }}
            />
            <YAxis
              stroke="#9A9A9A"
              tick={{ fill: '#9A9A9A', fontSize: 10 }}
              width={50}
              tickFormatter={(v: number) =>
                `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}`
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1A1A1A',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                color: '#fff',
                fontSize: 12,
              }}
              formatter={(value) =>
                `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              }
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#9A9A9A' }}
            />
            <Bar
              dataKey="investment"
              name="Investimento"
              fill="#5C5C5C"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="revenue"
              name="Receita"
              fill="#D4D4D4"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
