import { parseMoneyStringToCents } from '../core/domain/money'
import { classifyTransaction, DEFAULT_CATEGORIES, DEFAULT_RULES } from '../core/domain/rules'
import type { Account, FinanceBase, Goal, Transaction } from '../core/types/base'

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-bradesco',
    name: 'Bradesco Conta',
    institution: 'bradesco',
    type: 'checking',
    identifier: '18115-3',
  },
  {
    id: 'acc-santander-acc',
    name: 'Santander Conta',
    institution: 'santander',
    type: 'checking',
    identifier: '01.095863-6',
  },
  {
    id: 'acc-santander-card',
    name: 'Santander Cartão',
    institution: 'santander',
    type: 'credit_card',
    identifier: '0316',
    closingDay: 19,
    dueDay: 25,
  },
]

function parseDateToIso(dStr: string): string {
  if (!dStr) return ''
  const m = dStr.match(/^(\d{2})\/(\d{2})\/(\d{2,4})/)
  if (!m) return ''
  const [, d, mo, y] = m
  const fullY = y.length === 2 ? '20' + y : y
  return `${fullY}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export function parseLegacyBankTsv(
  tsvContent: string,
  accountId: string
): Transaction[] {
  const lines = tsvContent.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const header = lines[0].toLowerCase().split('\t')
  const idx = {
    date: header.findIndex((h) => h.includes('data')),
    desc: header.findIndex((h) => h.includes('desc') || h.includes('hist')),
    cat: header.findIndex((h) => h.includes('categ')),
    val: header.findIndex((h) => h.includes('valor')),
    type: header.findIndex((h) => h.includes('tipo')),
    bal: header.findIndex((h) => h.includes('saldo')),
  }

  const txs: Transaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (cols.length < 3) continue

    const dateStr = idx.date !== -1 ? cols[idx.date] : ''
    const date = parseDateToIso(dateStr)
    if (!date) continue

    const rawDesc = idx.desc !== -1 ? cols[idx.desc].replace(/"/g, '').trim() : ''
    const rawValStr = idx.val !== -1 ? cols[idx.val] : '0'
    const balStr = idx.bal !== -1 ? cols[idx.bal] : ''
    const rowType = idx.type !== -1 ? cols[idx.type].toLowerCase() : ''

    let amountCents = parseMoneyStringToCents(rawValStr)
    // If table labeled it 'despesa' or 'gasto' and amount was positive, negate it
    if ((rowType.includes('gasto') || rowType.includes('despesa')) && amountCents > 0) {
      amountCents = -amountCents
    }

    const { kind, categoryId } = classifyTransaction(rawDesc, amountCents, DEFAULT_RULES)
    const balanceAfterCents = balStr ? parseMoneyStringToCents(balStr) : undefined

    txs.push({
      id: `legacy-${accountId}-${date}-${i}-${Math.abs(amountCents)}`,
      accountId,
      date,
      description: rawDesc,
      rawDescription: rawDesc,
      amountCents,
      kind,
      categoryId,
      balanceAfterCents,
      source: 'legacy_sheet',
    })
  }

  return txs
}

export function parseLegacyCardTsv(
  tsvContent: string,
  accountId: string
): Transaction[] {
  const lines = tsvContent.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const header = lines[0].toLowerCase().split('\t')
  const idx = {
    date: header.findIndex((h) => h.includes('data')),
    desc: header.findIndex((h) => h.includes('desc')),
    cat: header.findIndex((h) => h.includes('categ')),
    val: header.findIndex((h) => h.includes('valor')),
    type: header.findIndex((h) => h.includes('tipo')),
  }

  const txs: Transaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (cols.length < 3) continue

    const dateStr = idx.date !== -1 ? cols[idx.date] : ''
    const date = parseDateToIso(dateStr)
    if (!date) continue

    const rawDesc = idx.desc !== -1 ? cols[idx.desc].replace(/"/g, '').trim() : 'Cartão'
    const rawValStr = idx.val !== -1 ? cols[idx.val] : '0'
    const rowType = idx.type !== -1 ? cols[idx.type].toLowerCase() : ''

    let amountCents = parseMoneyStringToCents(rawValStr)
    // Card purchases represent expenses (outflows)
    if (amountCents > 0 && !rowType.includes('receita') && !rowType.includes('pagamento')) {
      amountCents = -amountCents
    }

    const { kind, categoryId } = classifyTransaction(rawDesc, amountCents, DEFAULT_RULES)

    txs.push({
      id: `legacy-${accountId}-${date}-${i}-${Math.abs(amountCents)}`,
      accountId,
      date,
      description: rawDesc,
      rawDescription: rawDesc,
      amountCents,
      kind,
      categoryId,
      source: 'legacy_sheet',
    })
  }

  return txs
}

export function parseLegacyGoalsTsv(tsvContent: string): Goal[] {
  const lines = tsvContent.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const header = lines[0].toLowerCase().split('\t')
  const idx = {
    title: header.findIndex((h) => h.includes('tit')),
    total: header.findIndex((h) => h.includes('total') || h.includes('alvo')),
    current: header.findIndex((h) => h.includes('atual') || h.includes('acumulado')),
    dueDate: header.findIndex((h) => h.includes('meta')),
    monthly: header.findIndex((h) => h.includes('aporte')),
    image: header.findIndex((h) => h.includes('imagem') || h.includes('img')),
    priority: header.findIndex((h) => h.includes('prioridade')),
  }

  const goals: Goal[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t')
    if (cols.length < 2) continue

    const title = idx.title !== -1 ? cols[idx.title] : `Meta ${i}`
    const totalCents = idx.total !== -1 ? parseMoneyStringToCents(cols[idx.total]) : 0
    const savedCents = idx.current !== -1 ? parseMoneyStringToCents(cols[idx.current]) : 0
    const rawDue = idx.dueDate !== -1 ? cols[idx.dueDate] : ''
    const dueDate = parseDateToIso(rawDue) || '2026-12-31'
    const monthlyCents = idx.monthly !== -1 ? parseMoneyStringToCents(cols[idx.monthly]) : 0
    const imageLabel = idx.image !== -1 ? cols[idx.image] : undefined
    const priority = idx.priority !== -1 ? cols[idx.priority] : 'Média'

    if (totalCents > 0) {
      goals.push({
        id: `goal-${i}`,
        title,
        targetCents: totalCents,
        savedCents,
        monthlyContributionCents: monthlyCents,
        dueDate,
        category: 'Geral',
        imageLabel,
        priority,
      })
    }
  }

  return goals
}

/**
 * Combines the 4 legacy Google Sheets TSV texts into an initialized FinanceBase.
 */
export function buildBaseFromLegacyTsvs(sources: {
  bradescoTsv: string
  santanderAccTsv: string
  santanderCardTsv: string
  goalsTsv: string
}): FinanceBase {
  const bradTxs = parseLegacyBankTsv(sources.bradescoTsv, 'acc-bradesco')
  const santAccTxs = parseLegacyBankTsv(sources.santanderAccTsv, 'acc-santander-acc')
  const santCardTxs = parseLegacyCardTsv(sources.santanderCardTsv, 'acc-santander-card')
  const goals = parseLegacyGoalsTsv(sources.goalsTsv)

  const allTxs = [...bradTxs, ...santAccTxs, ...santCardTxs].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    accounts: INITIAL_ACCOUNTS,
    transactions: allTxs,
    statements: [],
    categories: DEFAULT_CATEGORIES,
    rules: DEFAULT_RULES,
    goals,
    settings: {
      fiscalStartDay: 16,
    },
  }
}
