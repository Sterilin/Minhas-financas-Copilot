import './ProgressBar.css'

interface ProgressBarProps {
  percent: number // 0 to 100
  label?: string
  color?: 'accent' | 'positive' | 'negative'
}

export function ProgressBar({ percent, label, color = 'positive' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))

  return (
    <div className="progress-bar-container" aria-label={label}>
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill progress-bar-fill-${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
