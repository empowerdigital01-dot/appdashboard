interface Period {
  month: number
  year: number
  label: string
}

interface PeriodSelectorProps {
  periods: Period[]
  currentPeriod: Period | null
  onChange: (period: Period) => void
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function PeriodSelector({
  periods,
  currentPeriod,
  onChange,
}: PeriodSelectorProps) {
  if (periods.length === 0 || !currentPeriod) {
    return null
  }

  const currentIndex = periods.findIndex(
    (p) => p.month === currentPeriod.month && p.year === currentPeriod.year
  )

  function goPrev() {
    if (currentIndex > 0) {
      onChange(periods[currentIndex - 1])
    }
  }

  function goNext() {
    if (currentIndex < periods.length - 1) {
      onChange(periods[currentIndex + 1])
    }
  }

  const monthLabel = MONTHS[currentPeriod.month - 1] || 'Mês'
  const display = `${monthLabel} ${currentPeriod.year}`

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        onClick={goPrev}
        disabled={currentIndex <= 0}
        className="rounded-lg border border-axium-border bg-axium-card px-2.5 py-1.5 text-sm text-axium-muted transition hover:text-white disabled:opacity-30 sm:px-3"
      >
        &lt;
      </button>
      <span className="min-w-[120px] text-center text-sm font-bold text-white sm:text-base">{display}</span>
      <button
        onClick={goNext}
        disabled={currentIndex >= periods.length - 1}
        className="rounded-lg border border-axium-border bg-axium-card px-2.5 py-1.5 text-sm text-axium-muted transition hover:text-white disabled:opacity-30 sm:px-3"
      >
        &gt;
      </button>
    </div>
  )
}
