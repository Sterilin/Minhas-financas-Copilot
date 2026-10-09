export type PageKey = 'summary' | 'comparison' | 'installments' | 'goals' | 'data'

export interface Account {
  id: string
  name: string
  type: 'corrente' | 'poupanca' | 'cartao'
  balance: number
  lastActivity: string
}

export interface CardInvoice {
  month: string
  total: number
  paid: number
}

export interface Installment {
  id: string
  title: string
  total: number
  paid: number
  dueDate: string
  status: 'em dia' | 'pendente' | 'atrasado'
}

export interface Goal {
  id: string
  title: string
  target: number
  saved: number
  monthlyContribution: number
  dueDate: string
  category: string
  imageLabel: string
}

export interface ComparisonItem {
  category: string
  periodA: number
  periodB: number
  variation: number
}

export interface SourceEntry {
  id: string
  source: string
  date: string
  description: string
  amount: number
  status: 'ok' | 'reconciliado' | 'pendente'
}
