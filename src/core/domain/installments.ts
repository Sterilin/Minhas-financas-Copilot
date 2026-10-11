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

const STRICT_INSTALLMENT_KEYWORD_REGEX = /(?:parc(?:ela)?\.?\s*|parcelamento\s+)(\d{1,2})\s*[/|\\]\s*(\d{1,2})/i
const TRAILING_INSTALLMENT_REGEX = /\b(\d{1,2})\s*[/|\\]\s*(\d{1,2})$/

/**
 * Parses installment metadata from a description string (e.g. "LOJA X PARC 03/10" -> { current: 3, total: 10, cleanTitle: "LOJA X" })
 */
export function extractInstallmentInfo(description: string): {
  current: number
  total: number
  cleanTitle: string
} | null {
  if (!description) return null

  // Ignore checking, pix, transfer, fee and date-like strings
  if (/(?:tarifa|pix|ted|doc|transf|saldo|des:)/i.test(description)) {
    return null
  }

  // Do not match full dates like DD/MM/YYYY
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(description)) {
    return null
  }

  let match = description.match(STRICT_INSTALLMENT_KEYWORD_REGEX)
  if (!match) {
    match = description.match(TRAILING_INSTALLMENT_REGEX)
  }
  if (!match) return null

  const current = parseInt(match[1], 10)
  const total = parseInt(match[2], 10)

  if (isNaN(current) || isNaN(total) || total <= 1 || total > 48 || current > total) {
    return null
  }

  const cleanTitle = description.replace(match[0], '').replace(/\s{2,}/g, ' ').trim()

  return { current, total, cleanTitle }
}

/**
 * Scans transactions and computes all active installment plans.
 */
export function deriveActiveInstallments(
  transactions: Transaction[],
  referenceDate?: string
): ActiveInstallment[] {
  const groups = new Map<string, ActiveInstallment>()

  // Determine latest transaction date in dataset as reference point
  const latestDate =
    referenceDate ||
    transactions.reduce((max, t) => (t.date > max ? t.date : max), '2026-01-01')

  for (const t of transactions) {
    // Installments only exist for credit cards
    const isCard =
      t.accountId.includes('card') ||
      t.accountId.includes('cartao') ||
      (t.installment !== undefined && t.balanceAfterCents === undefined)

    if (!isCard) continue

    const info = t.installment || extractInstallmentInfo(t.description)
    if (!info) continue

    const cleanTitle = extractInstallmentInfo(t.description)?.cleanTitle || t.description.replace(/\s+\d{1,2}\/\d{1,2}$/, '').trim()
    const groupKey = t.installment?.groupId || cleanTitle.toLowerCase()
    const amountCents = Math.abs(t.amountCents)

    const existing = groups.get(groupKey)
    if (!existing || info.current >= existing.currentInstallment) {
      const remainingCount = info.total - info.current
      const remainingCents = remainingCount * amountCents
      const paidCents = info.current * amountCents
      const totalCents = info.total * amountCents

      // Estimate projected end date based on remaining months
      const d = new Date(t.date)
      d.setMonth(d.getMonth() + remainingCount)
      const projectedEndDate = d.toISOString().slice(0, 10)

      groups.set(groupKey, {
        id: `inst-${groupKey}`,
        title: cleanTitle,
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

  // Filter only those that still have remaining installments and are not expired long ago
  return Array.from(groups.values())
    .filter((inst) => {
      if (inst.currentInstallment >= inst.totalInstallments) return false
      if (inst.remainingAmountCents <= 0) return false
      // If projected completion date is already earlier than the current statement horizon, it is not active
      if (inst.projectedEndDate < latestDate.slice(0, 7)) return false
      return true
    })
    .sort((a, b) => a.projectedEndDate.localeCompare(b.projectedEndDate))
}

