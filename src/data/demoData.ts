import type { Account, CardInvoice, ComparisonItem, Goal, Installment, SourceEntry } from '../types'

export const demoAccounts: Account[] = [
  { id: 'acc-1', name: 'Conta demo', type: 'corrente', balance: 18450.75, lastActivity: 'Hoje' },
  { id: 'acc-2', name: 'Poupança demo', type: 'poupanca', balance: 32600.0, lastActivity: 'Ontem' },
  { id: 'acc-3', name: 'Cartão demo', type: 'cartao', balance: -2380.5, lastActivity: '3 dias atrás' },
]

export const demoInvoices: CardInvoice[] = [
  { month: 'Jan', total: 4200.24, paid: 3950.0 },
  { month: 'Fev', total: 3855.15, paid: 3810.0 },
  { month: 'Mar', total: 4540.9, paid: 4422.5 },
]

export const demoInstallments: Installment[] = [
  { id: 'ins-1', title: 'Notebook demonstrativo', total: 4800, paid: 2400, dueDate: '2026-10-12', status: 'em dia' },
  { id: 'ins-2', title: 'Aparelho de ar-condicionado', total: 3200, paid: 1200, dueDate: '2026-10-18', status: 'pendente' },
  { id: 'ins-3', title: 'Móveis da sala', total: 5600, paid: 3500, dueDate: '2026-11-04', status: 'em dia' },
  { id: 'ins-4', title: 'Fundo de reserva', total: 1500, paid: 500, dueDate: '2026-11-15', status: 'atrasado' },
]

export const demoGoals: Goal[] = [
  { id: 'goal-1', title: 'Viagem de fim de ano', target: 18000, saved: 10400, monthlyContribution: 1400, dueDate: '2026-12-15', category: 'Lazer', imageLabel: ' praia demo' },
  { id: 'goal-2', title: 'Reserva de emergência', target: 30000, saved: 21950, monthlyContribution: 2200, dueDate: '2027-06-30', category: 'Segurança', imageLabel: 'segurança demo' },
  { id: 'goal-3', title: 'Investimento em educação', target: 12000, saved: 6600, monthlyContribution: 900, dueDate: '2027-01-10', category: 'Educação', imageLabel: 'curso demo' },
]

export const demoComparison: ComparisonItem[] = [
  { category: 'Moradia', periodA: 2400, periodB: 2520, variation: 5 },
  { category: 'Alimentação', periodA: 1800, periodB: 1710, variation: -5 },
  { category: 'Transporte', periodA: 620, periodB: 660, variation: 6 },
  { category: 'Lazer', periodA: 1350, periodB: 1430, variation: 6 },
]

export const demoEntries: SourceEntry[] = [
  { id: 'src-1', source: 'Conta demo', date: '2026-09-01', description: 'Salário demonstrativo', amount: 6200, status: 'ok' },
  { id: 'src-2', source: 'Cartão demo', date: '2026-09-05', description: 'Supermercado demo', amount: -420.5, status: 'reconciliado' },
  { id: 'src-3', source: 'Cartão demo', date: '2026-09-06', description: 'Combustível demo', amount: -180.0, status: 'ok' },
  { id: 'src-4', source: 'Conta demo', date: '2026-09-07', description: 'Transferência interna demo', amount: 1200, status: 'pendente' },
  { id: 'src-5', source: 'Cartão demo', date: '2026-09-10', description: 'Pagamento de fatura demo', amount: -2350, status: 'reconciliado' },
]
