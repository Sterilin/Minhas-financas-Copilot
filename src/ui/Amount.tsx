import { formatCents } from '../core/domain/money'

interface AmountProps {
  cents: number
  showSign?: boolean
  className?: string
  invertColors?: boolean // e.g. for card debt where positive is payment
}

export function Amount({
  cents,
  showSign = true,
  className = '',
  invertColors = false,
}: AmountProps) {
  let isPositive = cents > 0
  if (invertColors) isPositive = !isPositive

  const colorClass = cents === 0 ? 'amount-neutral' : isPositive ? 'amount-positive' : 'amount-negative'
  const sign = showSign && cents > 0 ? '+' : ''

  return (
    <span className={`amount ${colorClass} ${className}`}>
      {sign}
      <span className="money">{formatCents(cents)}</span>
    </span>
  )
}
