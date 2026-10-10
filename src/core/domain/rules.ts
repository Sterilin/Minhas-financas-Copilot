import type { Category, CategoryRule, TransactionKind } from '../types/base'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-moradia', name: 'Moradia', color: '#8A6A50' },
  { id: 'cat-alimentacao', name: 'Alimentação', color: '#ACBD5E' },
  { id: 'cat-mercado', name: 'Mercado', color: '#97A84B' },
  { id: 'cat-restaurante', name: 'Restaurante', color: '#B78449' },
  { id: 'cat-transporte', name: 'Transporte', color: '#4E6E4A' },
  { id: 'cat-semparar', name: 'Sem Parar', color: '#3A5737' },
  { id: 'cat-lazer', name: 'Lazer', color: '#C99E66' },
  { id: 'cat-bar', name: 'Bar', color: '#D4A365' },
  { id: 'cat-festa', name: 'Festa', color: '#E0B57E' },
  { id: 'cat-lojas', name: 'Lojas', color: '#5C4033' },
  { id: 'cat-streaming', name: 'Streaming', color: '#704B35' },
  { id: 'cat-farmacia', name: 'Farmácia', color: '#7E9A4F' },
  { id: 'cat-academia', name: 'Academia', color: '#6A8A42' },
  { id: 'cat-servicos', name: 'Serviços', color: '#4A7C59' },
  { id: 'cat-salario', name: 'Salário', color: '#3F7D4E', isIncome: true },
  { id: 'cat-freelance', name: 'Freelance', color: '#4E8C5D', isIncome: true },
  { id: 'cat-investimento', name: 'Investimento', color: '#36533A' },
  { id: 'cat-outros', name: 'Outros', color: '#8C827A' },
]

export const DEFAULT_RULES: CategoryRule[] = [
  // Card bill payments
  { id: 'rule-card-pay-1', pattern: 'pagamento fatura', type: 'contains', kind: 'card_payment', priority: 100 },
  { id: 'rule-card-pay-2', pattern: 'pagto fatura', type: 'contains', kind: 'card_payment', priority: 100 },
  { id: 'rule-card-pay-3', pattern: 'pagamento de fatura', type: 'contains', kind: 'card_payment', priority: 100 },
  { id: 'rule-card-pay-4', pattern: 'pagamento cartao credito', type: 'contains', kind: 'card_payment', priority: 100 },

  // Internal transfers between accounts
  { id: 'rule-transfer-1', pattern: 'trans sal p/c/c', type: 'contains', kind: 'transfer', priority: 90 },
  { id: 'rule-transfer-2', pattern: 'transf saldo c/sal', type: 'contains', kind: 'transfer', priority: 90 },
  { id: 'rule-transfer-3', pattern: 'transf conta', type: 'contains', kind: 'transfer', priority: 90 },
  { id: 'rule-transfer-4', pattern: 'transf. para', type: 'contains', kind: 'transfer', priority: 90 },
  { id: 'rule-transfer-5', pattern: 'transf tit', type: 'contains', kind: 'transfer', priority: 90 },
  { id: 'rule-transfer-6', pattern: 'pix bradesco', type: 'contains', kind: 'transfer', priority: 90 },
  { id: 'rule-transfer-7', pattern: 'pix santander', type: 'contains', kind: 'transfer', priority: 90 },
  { id: 'rule-transfer-8', pattern: 'pix recebido pedro gioia martins', type: 'contains', kind: 'transfer', priority: 90 },
  { id: 'rule-transfer-9', pattern: 'pedro gioia martins', type: 'contains', kind: 'transfer', priority: 85 },

  // Investment sweeps / automatic remunerations
  { id: 'rule-inv-1', pattern: 'apl.invest', type: 'contains', kind: 'investment', priority: 80 },
  { id: 'rule-inv-2', pattern: 'resgate inv', type: 'contains', kind: 'investment', priority: 80 },
  { id: 'rule-inv-3', pattern: 'invest facil', type: 'contains', kind: 'investment', priority: 80 },
  { id: 'rule-inv-4', pattern: 'rentab.invest', type: 'contains', kind: 'investment', priority: 80 },
  { id: 'rule-inv-5', pattern: 'remuneracao aplicacao automatica', type: 'contains', kind: 'investment', priority: 80 },

  // Common spending categories
  { id: 'rule-cat-semparar', pattern: 'sem parar', type: 'contains', categoryId: 'cat-semparar', priority: 50 },
  { id: 'rule-cat-apple', pattern: 'apple.com', type: 'contains', categoryId: 'cat-servicos', priority: 50 },
  { id: 'rule-cat-google', pattern: 'google', type: 'contains', categoryId: 'cat-servicos', priority: 50 },
  { id: 'rule-cat-steam', pattern: 'steam', type: 'contains', categoryId: 'cat-lazer', priority: 50 },
  { id: 'rule-cat-ifood', pattern: 'ifood', type: 'contains', categoryId: 'cat-alimentacao', priority: 50 },
  { id: 'rule-cat-ifd', pattern: 'ifd*', type: 'contains', categoryId: 'cat-alimentacao', priority: 50 },
]

/**
 * Classifies a transaction using the given rules list.
 */
export function classifyTransaction(
  description: string,
  amountCents: number,
  rules: CategoryRule[] = DEFAULT_RULES
): { kind: TransactionKind; categoryId?: string } {
  const descLower = description.toLowerCase()
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    let matched = false
    if (rule.type === 'contains') {
      matched = descLower.includes(rule.pattern.toLowerCase())
    } else if (rule.type === 'regex') {
      try {
        matched = new RegExp(rule.pattern, 'i').test(descLower)
      } catch {
        matched = false
      }
    }

    if (matched) {
      const defaultKind: TransactionKind = amountCents >= 0 ? 'income' : 'expense'
      return {
        kind: rule.kind || defaultKind,
        categoryId: rule.categoryId,
      }
    }
  }

  return {
    kind: amountCents >= 0 ? 'income' : 'expense',
    categoryId: undefined,
  }
}
