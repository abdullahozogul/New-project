import './ProgressBar.css'

type ProgressBarProps = {
  value: number
  max?: number
  label?: string
}

export function ProgressBar({ value, max = 100, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div
      className="lesson-progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className="lesson-progress__fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
