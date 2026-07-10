interface Expense {
  name: string
  value: number
}

interface TopExpensesListProps {
  expenses: Expense[]
  formatValue?: (v: number) => string
}

export default function TopExpensesList({
  expenses,
  formatValue = (v) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
}: TopExpensesListProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-axium-border bg-axium-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-axium-muted">Top 5 Despesas</h3>
        <p className="text-sm text-axium-neutral">Nenhum dado disponível</p>
      </div>
    )
  }

  const maxValue = Math.max(...expenses.map((e) => e.value))

  return (
    <div className="rounded-xl border border-axium-border bg-axium-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-axium-muted">Top 5 Despesas</h3>
      <div className="space-y-3">
        {expenses.map((expense, i) => {
          const pct = maxValue > 0 ? (expense.value / maxValue) * 100 : 0
          return (
            <div key={expense.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-axium-muted">
                  {i + 1}. {expense.name}
                </span>
                <span className="font-bold text-axium-negative">
                  {formatValue(expense.value)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-axium-border">
                <div
                  className="h-full rounded-full bg-axium-negative"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
