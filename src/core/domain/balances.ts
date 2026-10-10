import type { Account, FinanceBase } from '../types/base'
import { getFiscalPeriod } from './period'

export interface AccountBalanceInfo {
  account: Account
  balanceCents: number
  lastActivityDate?: string
  transactionCount: number
}

export interface DashboardMetrics {
  consolidatedBalanceCents: number
  totalCheckingCents: number
  totalSavingsInvestmentsCents: number
  creditCardOpenInvoiceCents: number
  periodIncomeCents: number
  periodExpenseCents: number
  periodResultCents: number
  savingsRatePercent: number
}

/**
 * Calculates current balances for all accounts based on statements and subsequent transactions.
 */
export function calculateAccountBalances(base: FinanceBase): AccountBalanceInfo[] {
  const result: AccountBalanceInfo[] = []

  for (const account of base.accounts) {
    const accTxs = base.transactions
      .filter((t) => t.accountId === account.id)
      .sort((a, b) => a.date.localeCompare(b.date)) // chronological

    // Check if there are statement records with a closing balance
    const accStatements = base.statements
      .filter((s) => s.accountId === account.id)
      .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd)) // latest statement

    const latestStatement = accStatements[accStatements.length - 1]

    let balanceCents = 0
    if (latestStatement && latestStatement.closingBalanceCents !== undefined) {
      balanceCents = latestStatement.closingBalanceCents

      // Add any transactions dated AFTER the statement's periodEnd
      const postStatementTxs = accTxs.filter((t) => t.date > latestStatement.periodEnd)
      for (const t of postStatementTxs) {
        balanceCents += t.amountCents
      }
    } else {
      // Sum all transactions
      for (const t of accTxs) {
        balanceCents += t.amountCents
      }
    }

    const lastTx = accTxs[accTxs.length - 1]

    result.push({
      account,
      balanceCents,
      lastActivityDate: lastTx?.date || latestStatement?.periodEnd,
      transactionCount: accTxs.length,
    })
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
  const accountBalances = calculateAccountBalances(base)
  const fiscalStartDay = base.settings.fiscalStartDay || 16

  let totalCheckingCents = 0
  let totalSavingsInvestmentsCents = 0
  let creditCardOpenInvoiceCents = 0

  for (const info of accountBalances) {
    if (info.account.type === 'checking') {
      totalCheckingCents += info.balanceCents
    } else if (info.account.type === 'savings' || info.account.type === 'investment') {
      totalSavingsInvestmentsCents += info.balanceCents
    } else if (info.account.type === 'credit_card') {
      // For credit cards, negative amount represents card debt/charges
      // Open invoice is the absolute sum of expenses not yet paid
      if (info.balanceCents < 0) {
        creditCardOpenInvoiceCents += Math.abs(info.balanceCents)
      }
    }
  }

  // Filter transactions for the requested fiscal period
  const periodTxs = base.transactions.filter((t) => {
    const p = getFiscalPeriod(t.date, fiscalStartDay)
    return p.key === fiscalPeriodKey
  })

  let periodIncomeCents = 0
  let periodExpenseCents = 0

  for (const t of periodTxs) {
    // Internal transfers and card payments do not count as pure income/expense
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

  const consolidatedBalanceCents = totalCheckingCents + totalSavingsInvestmentsCents - creditCardOpenInvoiceCents

  return {
    consolidatedBalanceCents,
    totalCheckingCents,
    totalSavingsInvestmentsCents,
    creditCardOpenInvoiceCents,
    periodIncomeCents,
    periodExpenseCents,
    periodResultCents,
    savingsRatePercent,
  }
}
