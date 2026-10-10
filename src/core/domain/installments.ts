import type { Transaction } from '../types/base'

export interface ActiveInstallment {
  id: string
  title: string
  currentInstallment: number
  totalInstallments: number
  installmentAmountCents: number
  totalAmountCents: number
  paidAmountCents: number
  remainingAmountCents: number
  lastDate: string
  projectedEndDate: string
}

const INSTALLMENT_REGEX = /(?:parc(?:ela)?\.?\s*|parcelamento\s+)?(\d{1,2})\s*[/|\\]\s*(\d{1,2})/i

/**
 * Parses installment metadata from a description string (e.g. "LOJA X PARC 03/10" -> { current: 3, total: 10, cleanTitle: "LOJA X" })
 */
export function extractInstallmentInfo(description: string): {
  current: number
  total: number
  cleanTitle: string
} | null {
  const match = description.match(INSTALLMENT_REGEX)
  if (!match) return null

  const current = parseInt(match[1], 10)
  const total = parseInt(match[2], 10)

  if (isNaN(current) || isNaN(total) || total <= 1 || current > total) {
    return null
  }

  const cleanTitle = description.replace(match[0], '').replace(/\s{2,}/g, ' ').trim()

  return { current, total, cleanTitle }
}

/**
 * Scans transactions and computes all active installment plans.
 */
export function deriveActiveInstallments(transactions: Transaction[]): ActiveInstallment[] {
  const groups = new Map<string, ActiveInstallment>()

  for (const t of transactions) {
    const info = t.installment || extractInstallmentInfo(t.description)
    if (!info) continue

    const title = extractInstallmentInfo(t.description)?.cleanTitle || t.description
    const key = title.toLowerCase()
    const amountCents = Math.abs(t.amountCents)

    const existing = groups.get(key)
    if (!existing || info.current > existing.currentInstallment) {
      const remainingCount = info.total - info.current
      const remainingCents = remainingCount * amountCents
      const paidCents = info.current * amountCents
      const totalCents = info.total * amountCents

      // Estimate projected end date based on remaining months
      const d = new Date(t.date)
      d.setMonth(d.getMonth() + remainingCount)
      const projectedEndDate = d.toISOString().slice(0, 10)

      groups.set(key, {
        id: `inst-${key}`,
        title,
        currentInstallment: info.current,
        totalInstallments: info.total,
        installmentAmountCents: amountCents,
        totalAmountCents: totalCents,
        paidAmountCents: paidCents,
        remainingAmountCents: remainingCents,
        lastDate: t.date,
        projectedEndDate,
      })
    }
  }

  // Filter only those that still have remaining installments
  return Array.from(groups.values())
    .filter((inst) => inst.currentInstallment < inst.totalInstallments)
    .sort((a, b) => a.projectedEndDate.localeCompare(b.projectedEndDate))
}
