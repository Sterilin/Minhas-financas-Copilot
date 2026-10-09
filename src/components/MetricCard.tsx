import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string
  detail?: string
  icon?: ReactNode
}

export function MetricCard({ label, value, detail, icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {icon ? <span className="metric-icon">{icon}</span> : null}
      </div>
      <strong className="metric-value">{value}</strong>
      {detail ? <small className="metric-detail">{detail}</small> : null}
    </article>
  )
}
