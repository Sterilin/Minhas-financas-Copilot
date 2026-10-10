import { parseMoneyStringToCents } from '../core/domain/money'
import { classifyTransaction, DEFAULT_RULES } from '../core/domain/rules'
import type { Transaction } from '../core/types/base'
import type { ParsedBankStatementResult } from './bradescoConta'
import type { ExtractedPdfDocument } from './pdfText'

export function detectSantanderConta(doc: ExtractedPdfDocument): number {
  const text = doc.fullText.toLowerCase()
  if (text.includes('santander') && text.includes('conta corrente') && (text.includes('extrato consolidado') || text.includes('saldo de conta corrente'))) {
    return 1.0
  }
  if (text.includes('santander') && text.includes('01.095863-6')) {
    return 1.0
  }
  return 0
}

export function parseSantanderContaPdf(
  doc: ExtractedPdfDocument,
  fileName: string,
  accountId = 'acc-santander-acc'
): ParsedBankStatementResult {
  const lines = doc.allLines

  // Determine year from filename or document
  let year = '2026'
  const yearMatch = fileName.match(/-(2\d)(?:\.pdf)?$/i) || doc.fullText.match(/(?:20)?(2[4-9])/)
  if (yearMatch) {
    year = yearMatch[1].length === 2 ? `20${yearMatch[1]}` : yearMatch[1]
  }

  let accountIdentifier = '01.095863-6'
  const accMatch = doc.fullText.match(/Conta\s+Corrente\s*([\d.-]+)/i)
  if (accMatch) {
    accountIdentifier = accMatch[1]
  }

  let openingBalanceCents: number | undefined
  let closingBalanceCents: number | undefined

  // Find header summary balances:
  // "Saldo de Conta Corrente em 31/12" followed by value
  for (let i = 0; i < lines.length - 2; i++) {
    if (lines[i].includes('Saldo de Conta Corrente em') && lines[i + 1]?.match(/^\d{1,3}(?:\.\d{3})*,\d{2}$/)) {
      if (openingBalanceCents === undefined) {
        openingBalanceCents = parseMoneyStringToCents(lines[i + 1])
      } else if (closingBalanceCents === undefined) {
        closingBalanceCents = parseMoneyStringToCents(lines[i + 1])
      }
    }
  }

  // Find table start: "Conta Corrente Movimentação"
  const transactions: Transaction[] = []
  let inTable = false
  let periodStart = ''
  let periodEnd = ''

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.includes('Conta Corrente') && lines[i + 1]?.includes('Movimentação')) {
      inTable = true
      i += 2
      continue
    }

    if (inTable) {
      // Check for table end
      if (line.startsWith('Se você não tem Limite') || line.includes('Saldos por Período') || line.includes('Extrato_PF_A4')) {
        inTable = false
        break
      }

      // Check initial balance line: "SALDO EM 31/12"
      if (line.startsWith('SALDO EM') && lines[i + 1]?.match(/^\d{1,3}(?:\.\d{3})*,\d{2}$/)) {
        const balStr = lines[i + 1]
        const dateMatch = line.match(/(\d{2}\/\d{2})/)
        if (dateMatch) {
          const [d, mo] = dateMatch[1].split('/')
          const dateIso = `${year}-${mo}-${d}`
          if (!periodStart) periodStart = dateIso
        }
        if (openingBalanceCents === undefined) {
          openingBalanceCents = parseMoneyStringToCents(balStr)
        }
        i += 2
        continue
      }

      // Check transaction line: date DD/MM
      if (line.match(/^\d{2}\/\d{2}$/)) {
        const [d, mo] = line.split('/')
        const txDate = `${year}-${mo}-${d}`
        if (!periodStart) periodStart = txDate
        periodEnd = txDate

        // Description follows
        let desc = lines[i + 1] || ''
        let nextIdx = i + 2

        // Gather description until movement amount
        while (
          nextIdx < lines.length &&
          !lines[nextIdx].match(/^\d{1,3}(?:\.\d{3})*,\d{2}-?$/) &&
          !lines[nextIdx].match(/^\d{2}\/\d{2}$/) &&
          !lines[nextIdx].startsWith('SALDO EM')
        ) {
          if (lines[nextIdx] !== '-') {
            desc += ' ' + lines[nextIdx]
          }
          nextIdx++
        }

        // Amount (with potential trailing minus)
        if (nextIdx < lines.length && lines[nextIdx].match(/^\d{1,3}(?:\.\d{3})*,\d{2}-?$/)) {
          const amtStr = lines[nextIdx]
          const amountCents = parseMoneyStringToCents(amtStr)
          nextIdx++

          // Optional running balance
          let balanceAfterCents: number | undefined
          if (nextIdx < lines.length && lines[nextIdx].match(/^\d{1,3}(?:\.\d{3})*,\d{2}$/)) {
            balanceAfterCents = parseMoneyStringToCents(lines[nextIdx])
            nextIdx++
          }

          const { kind, categoryId } = classifyTransaction(desc, amountCents, DEFAULT_RULES)

          transactions.push({
            id: `sant-acc-${txDate}-${transactions.length}-${Math.abs(amountCents)}`,
            accountId,
            date: txDate,
            description: desc.trim(),
            rawDescription: desc.trim(),
            amountCents,
            kind,
            categoryId,
            balanceAfterCents,
            source: 'pdf',
          })
        }

        i = nextIdx
        continue
      }
    }

    i++
  }

  // Reconcile closing balance
  if (closingBalanceCents === undefined && transactions.length > 0) {
    const lastWithBal = [...transactions].reverse().find((t) => t.balanceAfterCents !== undefined)
    if (lastWithBal) {
      closingBalanceCents = lastWithBal.balanceAfterCents
    }
  }

  const statementId = `stmt-${doc.fileHash.slice(0, 12)}`

  return {
    institution: 'santander',
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
