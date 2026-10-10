import { parseMoneyStringToCents } from '../core/domain/money'
import { classifyTransaction, DEFAULT_RULES } from '../core/domain/rules'
import type { StatementRecord, Transaction } from '../core/types/base'
import type { ExtractedPdfDocument } from './pdfText'

export interface ParsedBankStatementResult {
  institution: string
  accountType: 'checking' | 'credit_card'
  accountIdentifier: string
  periodStart: string
  periodEnd: string
  openingBalanceCents?: number
  closingBalanceCents?: number
  transactions: Transaction[]
  statement: StatementRecord
}

function formatDate(dStr: string): string {
  const [d, m, y] = dStr.split('/')
  return `${y}-${m}-${d}`
}

export function detectBradesco(doc: ExtractedPdfDocument): number {
  const text = doc.fullText.toLowerCase()
  if (text.includes('bradesco celular') || text.includes('extrato de: agência: 2297')) {
    return 1.0
  }
  if (text.includes('bradesco') && text.includes('histórico') && text.includes('saldo (r$)')) {
    return 0.8
  }
  return 0
}

export function parseBradescoPdf(
  doc: ExtractedPdfDocument,
  fileName: string,
  accountId = 'acc-bradesco'
): ParsedBankStatementResult {
  const lines = doc.allLines

  // Extract period
  let periodStart = ''
  let periodEnd = ''
  const periodMatch = doc.fullText.match(/Movimentação entre:\s*(\d{2}\/\d{2}\/\d{4})\s*e\s*(\d{2}\/\d{2}\/\d{4})/i)
  if (periodMatch) {
    periodStart = formatDate(periodMatch[1])
    periodEnd = formatDate(periodMatch[2])
  }

  // Extract account identifier
  let accountIdentifier = '18115-3'
  const accMatch = doc.fullText.match(/Conta:\s*([\d-]+)/i)
  if (accMatch) {
    accountIdentifier = accMatch[1]
  }

  let openingBalanceCents: number | undefined
  let closingBalanceCents: number | undefined
  const transactions: Transaction[] = []

  // Look for initial balance: "31/12/2025 COD. LANC. 0 0,00 21.578,53"
  for (let i = 0; i < lines.length - 3; i++) {
    if (lines[i].match(/^\d{2}\/\d{2}\/\d{4}$/) && lines[i + 1].includes('COD. LANC.')) {
      if (!periodStart) periodStart = formatDate(lines[i])
      const balStr = lines[i + 3]
      openingBalanceCents = parseMoneyStringToCents(balStr)
      break
    }
  }

  // Look for Total line at the end
  const totalIdx = lines.findIndex((l) => l.trim() === 'Total')
  if (totalIdx !== -1) {
    // Total line structure: Total, [Credito], [Debito], Saldo
    const remaining = lines.slice(totalIdx + 1, totalIdx + 5)
    const moneyValues = remaining.filter((r) => /^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(r))
    if (moneyValues.length > 0) {
      closingBalanceCents = parseMoneyStringToCents(moneyValues[moneyValues.length - 1])
    }
  }

  // Parse transaction rows
  // Typical row:
  // Date: DD/MM/YYYY
  // Histórico line 1 (+ optional line 2)
  // Docto: numeric string
  // Value: X.XXX,XX
  // Saldo: Y.YYY,YY
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const dateStr = line
      const txDate = formatDate(dateStr)

      // Skip COD. LANC. 0
      if (lines[i + 1]?.includes('COD. LANC.')) {
        i += 4
        continue
      }

      // Collect description lines until docto/number
      let desc = lines[i + 1] || ''
      let nextIdx = i + 2

      while (nextIdx < lines.length && !lines[nextIdx].match(/^\d{6,8}$/) && !lines[nextIdx].match(/^\d{1,3}(?:\.\d{3})*,\d{2}$/)) {
        if (lines[nextIdx] === 'Total' || lines[nextIdx].match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          break
        }
        desc += ' ' + lines[nextIdx]
        nextIdx++
      }

      // Read docto if present
      if (nextIdx < lines.length && lines[nextIdx].match(/^\d{6,8}$/)) {
        nextIdx++
      }

      // Read money amounts (value and running balance)
      const moneyValues: number[] = []
      while (nextIdx < lines.length && lines[nextIdx].match(/^\d{1,3}(?:\.\d{3})*,\d{2}$/)) {
        moneyValues.push(parseMoneyStringToCents(lines[nextIdx]))
        nextIdx++
      }

      if (moneyValues.length >= 2) {
        // First money value is the transaction amount, second is running balance
        const valCents = moneyValues[0]
        const runningBalCents = moneyValues[1]

        // Determine if it was credit or debit by checking running balance difference or description
        let signedAmountCents = valCents
        if (openingBalanceCents !== undefined && transactions.length > 0) {
          const prevBal = transactions[transactions.length - 1].balanceAfterCents ?? openingBalanceCents
          if (runningBalCents < prevBal) {
            signedAmountCents = -valCents
          }
        } else if (desc.toLowerCase().includes('enviado') || desc.toLowerCase().includes('deb') || desc.toLowerCase().includes('pag')) {
          signedAmountCents = -valCents
        }

        const { kind, categoryId } = classifyTransaction(desc, signedAmountCents, DEFAULT_RULES)

        transactions.push({
          id: `brad-${txDate}-${transactions.length}-${Math.abs(signedAmountCents)}`,
          accountId,
          date: txDate,
          description: desc.trim(),
          rawDescription: desc.trim(),
          amountCents: signedAmountCents,
          kind,
          categoryId,
          balanceAfterCents: runningBalCents,
          source: 'pdf',
        })
      }

      i = nextIdx
    } else {
      i++
    }
  }

  // Reconcile closing balance from last transaction if not set
  if (closingBalanceCents === undefined && transactions.length > 0) {
    closingBalanceCents = transactions[transactions.length - 1].balanceAfterCents
  }

  const statementId = `stmt-${doc.fileHash.slice(0, 12)}`

  return {
    institution: 'bradesco',
    accountType: 'checking',
    accountIdentifier,
    periodStart: periodStart || (transactions[0]?.date ?? ''),
    periodEnd: periodEnd || (transactions[transactions.length - 1]?.date ?? ''),
    openingBalanceCents,
    closingBalanceCents,
    transactions: transactions.map((t) => ({ ...t, statementId })),
    statement: {
      id: statementId,
      accountId,
      fileHash: doc.fileHash,
      fileName,
      importedAt: new Date().toISOString(),
      periodStart: periodStart || (transactions[0]?.date ?? ''),
      periodEnd: periodEnd || (transactions[transactions.length - 1]?.date ?? ''),
      openingBalanceCents,
      closingBalanceCents,
      transactionCount: transactions.length,
    },
  }
}
