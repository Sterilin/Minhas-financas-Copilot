import React from 'react'
import './MetricCard.css'

interface MetricCardProps {
  label: string
  value: React.ReactNode
  detail?: React.ReactNode
  icon?: React.ReactNode
  variant?: 'default' | 'positive' | 'negative' | 'accent'
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  variant = 'default',
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-card-${variant}`}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {icon && <div className="metric-icon">{icon}</div>}
      </div>
      <div className="metric-value">{value}</div>
      {detail && <span className="metric-detail">{detail}</span>}
    </article>
  )
}
