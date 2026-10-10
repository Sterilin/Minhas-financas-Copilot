import { formatCents } from '../core/domain/money'

interface MoneyProps {
  cents: number
  className?: string
}

export function Money({ cents, className = '' }: MoneyProps) {
  return <span className={`money ${className}`}>{formatCents(cents)}</span>
}
