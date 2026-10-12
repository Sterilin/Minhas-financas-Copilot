import type { Category, CategoryRule, FinanceBase, Transaction, TransactionKind } from '../types/base'

/**
 * Bump this whenever DEFAULT_RULES / DEFAULT_CATEGORIES change so existing
 * vaults receive the new defaults on the next unlock.
 */
export const RULES_VERSION = 2

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-moradia', name: 'Moradia', color: '#8A6A50' },
  { id: 'cat-casa', name: 'Casa & Contas', color: '#9A7B5F' },
  { id: 'cat-alimentacao', name: 'Alimentação', color: '#ACBD5E' },
  { id: 'cat-mercado', name: 'Mercado', color: '#97A84B' },
  { id: 'cat-restaurante', name: 'Restaurante', color: '#B78449' },
  { id: 'cat-transporte', name: 'Transporte', color: '#4E6E4A' },
  { id: 'cat-semparar', name: 'Sem Parar', color: '#3A5737' },
  { id: 'cat-viagem', name: 'Viagem', color: '#6B8F8A' },
  { id: 'cat-lazer', name: 'Lazer', color: '#C99E66' },
  { id: 'cat-bar', name: 'Bar', color: '#D4A365' },
  { id: 'cat-festa', name: 'Festa', color: '#E0B57E' },
  { id: 'cat-lojas', name: 'Lojas', color: '#5C4033' },
  { id: 'cat-streaming', name: 'Streaming', color: '#704B35' },
  { id: 'cat-farmacia', name: 'Farmácia', color: '#7E9A4F' },
  { id: 'cat-academia', name: 'Academia', color: '#6A8A42' },
  { id: 'cat-servicos', name: 'Serviços', color: '#4A7C59' },
  { id: 'cat-tarifas', name: 'Tarifas & Encargos', color: '#A0645A' },
  { id: 'cat-salario', name: 'Salário', color: '#3F7D4E', isIncome: true },
  { id: 'cat-freelance', name: 'Freelance', color: '#4E8C5D', isIncome: true },
  { id: 'cat-investimento', name: 'Investimento', color: '#36533A' },
  { id: 'cat-outros', name: 'Outros', color: '#8C827A' },
]

/** Helper to declare many "contains" category rules at once. */
function cat(categoryId: string, priority: number, patterns: string[]): CategoryRule[] {
  return patterns.map((pattern, i) => ({
    id: `rule-${categoryId.replace('cat-', '')}-${i}-${pattern.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`,
    pattern,
    type: 'contains' as const,
    categoryId,
    priority,
  }))
}

export const DEFAULT_RULES: CategoryRule[] = [
  // Card bill payments
  { id: 'rule-card-pay-1', pattern: 'pagamento fatura', type: 'contains', kind: 'card_payment', priority: 100 },
  { id: 'rule-card-pay-2', pattern: 'pagto fatura', type: 'contains', kind: 'card_payment', priority: 100 },
  { id: 'rule-card-pay-3', pattern: 'pagamento de fatura', type: 'contains', kind: 'card_payment', priority: 100 },
  { id: 'rule-card-pay-4', pattern: 'pagamento cartao credito', type: 'contains', kind: 'card_payment', priority: 100 },
  { id: 'rule-card-pay-5', pattern: 'pagamento cartão credito', type: 'contains', kind: 'card_payment', priority: 100 },
  { id: 'rule-card-pay-6', pattern: 'deb aut. fat', type: 'contains', kind: 'card_payment', priority: 100 },
  { id: 'rule-card-pay-7', pattern: 'debito aut. fat', type: 'contains', kind: 'card_payment', priority: 100 },

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
  { id: 'rule-transfer-10', pattern: 'ted mesma titularidade', type: 'contains', kind: 'transfer', priority: 85 },

  // Investment sweeps / automatic remunerations
  { id: 'rule-inv-1', pattern: 'apl.invest', type: 'contains', kind: 'investment', priority: 80 },
  { id: 'rule-inv-2', pattern: 'resgate inv', type: 'contains', kind: 'investment', priority: 80 },
  { id: 'rule-inv-3', pattern: 'invest facil', type: 'contains', kind: 'investment', priority: 80 },
  { id: 'rule-inv-4', pattern: 'rentab.invest', type: 'contains', kind: 'investment', priority: 80 },
  { id: 'rule-inv-5', pattern: 'remuneracao aplicacao automatica', type: 'contains', kind: 'investment', priority: 80 },

  // Yields (kept as income, but categorized as investment)
  ...cat('cat-investimento', 70, ['rent.inv', 'rent.iny', 'remuneracao contamax', 'remuneração contamax']),

  // Fees & charges
  ...cat('cat-tarifas', 65, ['tarifa', 'anuidade', 'iof ', 'juros', 'encargo', 'cart cred anuid', 'cotação dolar', 'cotacao dolar']),

  // Restaurants have priority over generic "bar"/"mercado" words
  ...cat('cat-restaurante', 56, [
    'restaurant', 'sushi', 'grill', 'burger', 'pizza', 'lanchonete', 'lanches', 'madero', 'outback',
    'mc donalds', 'mcdonalds', 'burger king', 'padaria', 'sorvete', 'gelateria', 'acai', 'açai',
    'churrasc', 'cantinho do viaduto', 'braseiro', 'pastelaria', 'itabar', 'kobe', 'zensei',
    'sabor', 'bistro', 'delivery', 'crepe', 'palestrinha', 'cafe', 'café', 'bauducco', 'premiatto',
  ]),
  ...cat('cat-alimentacao', 55, ['ifood', 'ifd*', 'ifd ', 'rappi']),

  // Transport & car
  ...cat('cat-transporte', 54, ['uber', '99 pop', '99*', '99 99', 'cabify', 'tembici', 'posto ', 'shell', 'ipiranga']),
  ...cat('cat-semparar', 54, ['sem parar', 'autoban', 'estacionamento', 'parking', 'x park', 'parque dompedro']),
  ...cat('cat-viagem', 54, ['gol linhas', 'latam', 'azul linhas', 'airbnb', 'booking', 'hotel', 'almaresenior']),

  // Entertainment
  ...cat('cat-festa', 53, ['zig', 'ingresse', 'ingresso', 'ticket', 'tycket', 'sympla', 'tuna club', 'tuna *', 'tomorrowland', 'frogpay']),
  ...cat('cat-lazer', 52, ['steam', 'cinema', 'kinoplex', 'boliche', 'bowl', 'pichau', 'barbeiro', 'barbearia']),
  ...cat('cat-bar', 51, ['bar ', 'boteco', 'narguil', 'cervejaria', 'chopp', 'bare ']),

  // Subscriptions
  ...cat('cat-streaming', 53, ['apple.com', 'apple com', 'amazonprime', 'amazon prime', 'youtube', 'netflix', 'spotify', 'disney', 'hbo', 'max.com']),
  ...cat('cat-servicos', 50, ['google', 'enxadahost', 'enx services', 'cartorio', 'cartório']),
  ...cat('cat-academia', 53, ['totalpass', 'smartfit', 'smart fit', 'gympass', 'wellhub']),

  // Groceries / health / shopping / home
  ...cat('cat-mercado', 52, ['supermercado', 'mercado', 'emporio', 'empório', 'atacad', 'oxxo', 'papa 11', 'hortifruti', 'carrefour', 'pao de acucar', 'mercadinho']),
  ...cat('cat-farmacia', 53, ['drogasil', 'droga', 'farmacia', 'farmácia', 'pague menos']),
  ...cat('cat-lojas', 57, ['mercadolivre', 'mercado livre', 'mercadopago*loja']),
  ...cat('cat-lojas', 50, [
    'natura', 'centauro', 'leroy', 'pernambucanas', 'renner', 'shopee', 'magalu',
    'amazon', 'bom baiano', 'livraria', 'multicoisas', 'lojas', 'calcados', 'calçados', 'outlet',
  ]),
  ...cat('cat-casa', 53, ['ultragaz', 'enel', 'sabesp', 'cpfl', 'vivo', 'claro', 'condominio', 'condomínio']),
]

/** Kinds that represent money moving between the user's own accounts / cards. */
const STRUCTURAL_KINDS: TransactionKind[] = ['transfer', 'card_payment', 'investment']

function ruleMatches(rule: CategoryRule, descLower: string): boolean {
  if (rule.type === 'contains') {
    return descLower.includes(rule.pattern.toLowerCase())
  }
  if (rule.type === 'regex') {
    try {
      return new RegExp(rule.pattern, 'i').test(descLower)
    } catch {
      return false
    }
  }
  return false
}

/** Returns the highest-priority rule matching the description, if any. */
export function findMatchingRule(description: string, rules: CategoryRule[]): CategoryRule | undefined {
  const descLower = description.toLowerCase()
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)
  return sortedRules.find((rule) => ruleMatches(rule, descLower))
}

/**
 * Classifies a transaction using the given rules list.
 */
export function classifyTransaction(
  description: string,
  amountCents: number,
  rules: CategoryRule[] = DEFAULT_RULES
): { kind: TransactionKind; categoryId?: string } {
  const defaultKind: TransactionKind = amountCents >= 0 ? 'income' : 'expense'
  const rule = findMatchingRule(description, rules)
  if (!rule) return { kind: defaultKind, categoryId: undefined }
  return {
    kind: rule.kind || defaultKind,
    categoryId: rule.categoryId,
  }
}

/**
 * Re-applies the rule set to a single transaction. Kind and category are fully
 * derived from the rules so that adding/removing a rule in Configurações always
 * reflects on the whole base. Unmatched expenses fall into "Outros".
 */
export function applyRulesToTransaction(tx: Transaction, rules: CategoryRule[]): Transaction {
  const { kind, categoryId } = classifyTransaction(
    `${tx.description} ${tx.rawDescription !== tx.description ? tx.rawDescription : ''}`.trim(),
    tx.amountCents,
    rules
  )
  const finalCategory = STRUCTURAL_KINDS.includes(kind) ? undefined : categoryId ?? (kind === 'expense' ? 'cat-outros' : undefined)
  if (tx.kind === kind && tx.categoryId === finalCategory) return tx
  return { ...tx, kind, categoryId: finalCategory }
}

export function applyRulesToTransactions(transactions: Transaction[], rules: CategoryRule[]): Transaction[] {
  return transactions.map((t) => applyRulesToTransaction(t, rules))
}

/** Sorts newest first (stable on ties by id) so the most recent entries are always shown first. */
export function sortTransactionsDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

/**
 * Normalizes the base: re-classifies every transaction with the current rules and sorts them.
 */
export function normalizeBase(base: FinanceBase): FinanceBase {
  return {
    ...base,
    transactions: sortTransactionsDesc(applyRulesToTransactions(base.transactions, base.rules)),
  }
}

/**
 * Merges the default categories/rules into an existing list. Defaults with the same id are
 * refreshed; user-created rules are preserved.
 */
export function mergeDefaultRules(existing: CategoryRule[]): CategoryRule[] {
  const defaultIds = new Set(DEFAULT_RULES.map((r) => r.id))
  const userRules = existing.filter((r) => !defaultIds.has(r.id))
  return [...userRules, ...DEFAULT_RULES]
}

export function mergeDefaultCategories(existing: Category[]): Category[] {
  const ids = new Set(existing.map((c) => c.id))
  return [...existing, ...DEFAULT_CATEGORIES.filter((c) => !ids.has(c.id))]
}
