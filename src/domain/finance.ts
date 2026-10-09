import type { Account, Goal, Installment } from '../types'

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value: number) {
  return currencyFormatter.format(value)
}

export function calculateNetWorth(accounts: Account[]) {
  return accounts.reduce((total, account) => total + account.balance, 0)
}

export function calculateAverageInvoice(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

export function calculateReservedAmount(goals: Goal[]) {
  return goals.reduce((total, goal) => total + goal.saved, 0)
}

export function calculateProgress(goal: Goal) {
  return Math.min(100, (goal.saved / goal.target) * 100)
}

export function getUpcomingInstallments(installments: Installment[]) {
  return [...installments]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3)
}
