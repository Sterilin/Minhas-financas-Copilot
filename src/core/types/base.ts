export interface Account {
  id: string
  name: string
  institution: 'bradesco' | 'santander' | string
  type: 'checking' | 'savings' | 'credit_card' | 'investment'
  identifier: string // e.g. '18115-3', '01.095863-6', '0316'
  closingDay?: number
  dueDay?: number
  archived?: boolean
}

export type TransactionKind = 'income' | 'expense' | 'transfer' | 'card_payment' | 'investment' | 'refund'

export interface InstallmentInfo {
  current: number
  total: number
  groupId: string // identifier linking related installments
}

export interface Transaction {
  id: string
  accountId: string
  date: string // YYYY-MM-DD
  description: string
  rawDescription: string
  amountCents: number // signed integer: positive = income/inflow, negative = expense/outflow
  kind: TransactionKind
  categoryId?: string
  installment?: InstallmentInfo
  statementId?: string
  source: 'pdf' | 'legacy_sheet' | 'manual'
  balanceAfterCents?: number
  note?: string
}

export interface StatementRecord {
  id: string
  accountId: string
  fileHash: string
  fileName: string
  importedAt: string
  periodStart: string // YYYY-MM-DD
  periodEnd: string // YYYY-MM-DD
  openingBalanceCents?: number
  closingBalanceCents?: number
  invoiceTotalCents?: number
  dueDate?: string
  transactionCount: number
}

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
  isIncome?: boolean
}

export interface CategoryRule {
  id: string
  pattern: string
  type: 'contains' | 'regex'
  categoryId?: string
  kind?: TransactionKind
  priority: number
}

export interface Goal {
  id: string
  title: string
  targetCents: number
  savedCents: number
  monthlyContributionCents: number
  dueDate: string
  category: string
  imageLabel?: string
  priority?: string
  yieldRate?: number
}

export interface AppSettings {
  fiscalStartDay: number // default: 16 (from day 16 of prev month to day 15 of current)
  githubRepo?: string
  githubBranch?: string
  theme?: string
  privacyMode?: boolean
  lastBackupAt?: string
}

export interface FinanceBase {
  schemaVersion: 1
  updatedAt?: string
  lastModified?: string
  accounts: Account[]
  transactions: Transaction[]
  statements: StatementRecord[]
  categories: Category[]
  rules: CategoryRule[]
  goals: Goal[]
  settings: AppSettings
}
