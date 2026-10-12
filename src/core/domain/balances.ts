import type { Account, FinanceBase } from '../types/base'
import { deriveActiveInstallments } from './installments'
import { getFiscalPeriod } from './period'

export interface AccountBalanceInfo {
  account: Account
  balanceCents: number
  isCard: boolean
  invoiceCents?: number
  dueDate?: string
  lastActivityDate?: string
  transactionCount: number
}

export interface DashboardMetrics {
  accounts: AccountBalanceInfo[]
  bradesco?: AccountBalanceInfo
  santanderAcc?: AccountBalanceInfo
  santanderCard?: AccountBalanceInfo
  periodIncomeCents: number
  periodExpenseCents: number
  periodResultCents: number
  savingsRatePercent: number
}

/**
 * Calculates balances/invoices for all accounts for a given fiscal period (or latest if omitted).
 */
export function calculateAccountBalances(
  base: FinanceBase,
  fiscalPeriodKey?: string
): AccountBalanceInfo[] {
  const result: AccountBalanceInfo[] = []
  const fiscalStartDay = base.settings.fiscalStartDay || 16

  for (const account of base.accounts) {
    const isCard = account.type === 'credit_card'
    const accTxs = base.transactions.filter((t) => t.accountId === account.id)

    // Filter statements for this account
    const accStatements = base.statements
      .filter((s) => s.accountId === account.id)
      .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd))

    // Find statement matching the fiscal period if provided, otherwise latest
    let matchedStmt = accStatements[accStatements.length - 1]
    if (fiscalPeriodKey) {
      const found =
        accStatements.find((s) => {
          const monthKey = s.dueDate ? s.dueDate.slice(0, 7) : s.periodEnd.slice(0, 7)
          return monthKey === fiscalPeriodKey
        }) ||
        accStatements.find((s) => {
          const p = getFiscalPeriod(s.periodEnd, fiscalStartDay)
          return p.key === fiscalPeriodKey
        })
      if (found) {
        matchedStmt = found
      }
    }

    if (isCard) {
      // For credit cards: show the invoice total for that cycle
      let invoiceCents = 0
      let dueDate = account.dueDay ? `${account.dueDay}` : undefined

      if (matchedStmt) {
        invoiceCents = matchedStmt.invoiceTotalCents ?? Math.abs(matchedStmt.closingBalanceCents ?? 0)
        dueDate = matchedStmt.dueDate || dueDate
      } else if (fiscalPeriodKey) {
        // Fallback: sum card purchases in that fiscal period
        const periodCardTxs = accTxs.filter((t) => {
          const p = getFiscalPeriod(t.date, fiscalStartDay)
          return p.key === fiscalPeriodKey && t.kind !== 'card_payment' && t.amountCents < 0
        })
        invoiceCents = periodCardTxs.reduce((sum, t) => sum + Math.abs(t.amountCents), 0)
      }

      result.push({
        account,
        balanceCents: invoiceCents,
        isCard: true,
        invoiceCents,
        dueDate,
        lastActivityDate: matchedStmt?.periodEnd || accTxs[0]?.date,
        transactionCount: accTxs.length,
      })
    } else {
      // For checking accounts: show bank balance at the end of statement/period
      let balanceCents = 0

      if (matchedStmt && matchedStmt.closingBalanceCents !== undefined) {
        balanceCents = matchedStmt.closingBalanceCents

        // If no fiscal period specified, add any transactions occurring after the latest statement
        if (!fiscalPeriodKey) {
          const postTxs = accTxs.filter((t) => t.date > matchedStmt.periodEnd)
          for (const t of postTxs) {
            balanceCents += t.amountCents
          }
        }
      } else {
        // Fallback: find latest transaction with a running balance
        const txsChron = [...accTxs].sort((a, b) => a.date.localeCompare(b.date))
        const withBal = txsChron.filter((t) => {
          if (fiscalPeriodKey) {
            const p = getFiscalPeriod(t.date, fiscalStartDay)
            return p.key <= fiscalPeriodKey && t.balanceAfterCents !== undefined
          }
          return t.balanceAfterCents !== undefined
        })

        if (withBal.length > 0) {
          balanceCents = withBal[withBal.length - 1].balanceAfterCents!
        } else {
          for (const t of txsChron) {
            balanceCents += t.amountCents
          }
        }
      }

      result.push({
        account,
        balanceCents,
        isCard: false,
        lastActivityDate: matchedStmt?.periodEnd || accTxs[0]?.date,
        transactionCount: accTxs.length,
      })
    }
  }

  return result
}

/**
 * Computes overall dashboard metrics for a chosen fiscal period.
 */
export function calculateDashboardMetrics(
  base: FinanceBase,
  fiscalPeriodKey: string
): DashboardMetrics {
  const accountBalances = calculateAccountBalances(base, fiscalPeriodKey)
  const fiscalStartDay = base.settings.fiscalStartDay || 16

  const bradesco = accountBalances.find((a) => a.account.id === 'acc-bradesco')
  const santanderAcc = accountBalances.find((a) => a.account.id === 'acc-santander-acc')
  const santanderCard = accountBalances.find((a) => a.account.id === 'acc-santander-card')

  // Filter transactions for the requested fiscal period
  const periodTxs = base.transactions.filter((t) => {
    const p = getFiscalPeriod(t.date, fiscalStartDay)
    return p.key === fiscalPeriodKey
  })

  let periodIncomeCents = 0
  let periodExpenseCents = 0

  for (const t of periodTxs) {
    // Internal sweeps and transfers do not count as pure income/expense
    if (t.kind === 'transfer' || t.kind === 'card_payment') {
      continue
    }

    if (t.kind === 'income' || t.amountCents > 0) {
      periodIncomeCents += Math.abs(t.amountCents)
    } else if (t.kind === 'expense' || t.amountCents < 0) {
      periodExpenseCents += Math.abs(t.amountCents)
    }
  }

  const periodResultCents = periodIncomeCents - periodExpenseCents
  const savingsRatePercent =
    periodIncomeCents > 0
      ? Math.max(0, Math.min(100, Math.round((periodResultCents / periodIncomeCents) * 100)))
      : 0

  return {
    accounts: accountBalances,
    bradesco,
    santanderAcc,
    santanderCard,
    periodIncomeCents,
    periodExpenseCents,
    periodResultCents,
    savingsRatePercent,
  }
}

export interface CardMonthSummary {
  monthKey: string
  amountCents: number
}

export interface AvailableBalanceProjection {
  totalBankBalanceCents: number
  card3MonthAvgCents: number
  cardMonthsEvaluated: CardMonthSummary[]
  totalUnpaidInstallmentsCents: number
  totalCommittedCents: number
  freeBalanceCents: number
  committedRatioPercent: number
  freeRatioPercent: number
  activeInstallmentsCount: number
  cardsEvaluatedCount: number
}

/**
 * Calculates total available bank balance vs future committed expenses
 * (3-month credit card average + remaining unpaid installments).
 */
export function calculateAvailableBalanceProjection(
  base: FinanceBase,
  fiscalPeriodKey?: string
): AvailableBalanceProjection {
  const accountBalances = calculateAccountBalances(base, fiscalPeriodKey)
  const bankAccounts = accountBalances.filter((a) => !a.isCard)
  const totalBankBalanceCents = bankAccounts.reduce(
    (sum, a) => sum + Math.max(0, a.balanceCents),
    0
  )

  // Identify credit card accounts
  const cardAccounts = base.accounts.filter((a) => a.type === 'credit_card')
  const cardAccountIds = new Set(cardAccounts.map((a) => a.id))

  // Group card statement invoices by month (up to fiscalPeriodKey if provided)
  let cardStmts = base.statements.filter((s) => cardAccountIds.has(s.accountId))
  if (fiscalPeriodKey) {
    cardStmts = cardStmts.filter((s) => {
      const monthKey = s.dueDate ? s.dueDate.slice(0, 7) : s.periodEnd.slice(0, 7)
      return monthKey <= fiscalPeriodKey
    })
  }

  const monthlyCardTotals = new Map<string, number>()
  for (const stmt of cardStmts) {
    const monthKey = stmt.dueDate ? stmt.dueDate.slice(0, 7) : stmt.periodEnd.slice(0, 7)
    const val = stmt.invoiceTotalCents ?? Math.abs(stmt.closingBalanceCents ?? 0)
    monthlyCardTotals.set(monthKey, (monthlyCardTotals.get(monthKey) || 0) + val)
  }

  const sortedMonths = Array.from(monthlyCardTotals.keys()).sort()
  const last3Months = sortedMonths.slice(-3)
  const cardMonthsEvaluated: CardMonthSummary[] = last3Months.map((monthKey) => ({
    monthKey,
    amountCents: monthlyCardTotals.get(monthKey) || 0,
  }))

  let card3MonthAvgCents = 0
  if (cardMonthsEvaluated.length > 0) {
    const total3Months = cardMonthsEvaluated.reduce((sum, m) => sum + m.amountCents, 0)
    card3MonthAvgCents = Math.round(total3Months / cardMonthsEvaluated.length)
  } else {
    // Fallback if statements are not present: use card transactions in recent months
    const cardTxs = base.transactions.filter(
      (t) => cardAccountIds.has(t.accountId) && t.amountCents < 0 && t.kind !== 'card_payment'
    )
    const txMonths = new Map<string, number>()
    for (const t of cardTxs) {
      const m = t.date.slice(0, 7)
      if (!fiscalPeriodKey || m <= fiscalPeriodKey) {
        txMonths.set(m, (txMonths.get(m) || 0) + Math.abs(t.amountCents))
      }
    }
    const sortedTxMonths = Array.from(txMonths.keys()).sort().slice(-3)
    for (const m of sortedTxMonths) {
      cardMonthsEvaluated.push({
        monthKey: m,
        amountCents: txMonths.get(m) || 0,
      })
    }
    if (cardMonthsEvaluated.length > 0) {
      const sum = cardMonthsEvaluated.reduce((acc, m) => acc + m.amountCents, 0)
      card3MonthAvgCents = Math.round(sum / cardMonthsEvaluated.length)
    }
  }

  // Derive active unpaid installments
  const activeInstallments = deriveActiveInstallments(base.transactions)
  const totalUnpaidInstallmentsCents = activeInstallments.reduce(
    (sum, inst) => sum + inst.remainingAmountCents,
    0
  )

  const totalCommittedCents = card3MonthAvgCents + totalUnpaidInstallmentsCents
  const freeBalanceCents = Math.max(0, totalBankBalanceCents - totalCommittedCents)

  const committedRatioPercent =
    totalBankBalanceCents > 0
      ? Math.min(100, Math.round((totalCommittedCents / totalBankBalanceCents) * 1000) / 10)
      : 0
  const freeRatioPercent =
    totalBankBalanceCents > 0
      ? Math.max(0, Math.round((freeBalanceCents / totalBankBalanceCents) * 1000) / 10)
      : 0

  return {
    totalBankBalanceCents,
    card3MonthAvgCents,
    cardMonthsEvaluated,
    totalUnpaidInstallmentsCents,
    totalCommittedCents,
    freeBalanceCents,
    committedRatioPercent,
    freeRatioPercent,
    activeInstallmentsCount: activeInstallments.length,
    cardsEvaluatedCount: cardAccounts.length,
  }
}
