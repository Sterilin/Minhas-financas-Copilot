import { parseMoneyStringToCents } from '../core/domain/money'
import { classifyTransaction, DEFAULT_RULES } from '../core/domain/rules'
import { extractInstallmentInfo } from '../core/domain/installments'
import type { Transaction } from '../core/types/base'
import type { ParsedBankStatementResult } from './bradescoConta'
import type { ExtractedPdfDocument } from './pdfText'

export function detectSantanderCartao(doc: ExtractedPdfDocument): number {
  const text = doc.fullText.toLowerCase()
  if (text.includes('fatura') && text.includes('santander') && (text.includes('detalhamento da fatura') || text.includes('total a pagar'))) {
    return 1.0
  }
  if (text.includes('santander') && text.includes('elite mastercard')) {
    return 1.0
  }
  return 0
}

function parseShortDate(dateStr: string, defaultYear = '2026'): string {
  const parts = dateStr.split('/')
  if (parts.length === 2) {
    return `${defaultYear}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  } else if (parts.length === 3) {
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
    return `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return ''
}

export function parseSantanderCartaoPdf(
  doc: ExtractedPdfDocument,
  fileName: string,
  accountId = 'acc-santander-card'
): ParsedBankStatementResult {
  const lines = doc.allLines

  let defaultYear = '2026'
  const yearMatch = fileName.match(/-(2\d)(?:\.pdf)?$/i) || doc.fullText.match(/20(2[4-9])/)
  if (yearMatch) {
    defaultYear = yearMatch[1].length === 2 ? `20${yearMatch[1]}` : yearMatch[1]
  }

  let totalAPagarCents = 0
  let dueDate = ''
  let periodStart = ''
  let periodEnd = ''

  // Look for "Total a Pagar" and "Vencimento"
  for (let i = 0; i < lines.length - 2; i++) {
    if (lines[i].includes('Total a Pagar') && lines[i + 1]?.match(/^R\$\s*[\d.,]+$/i)) {
      totalAPagarCents = parseMoneyStringToCents(lines[i + 1])
    }
    if (lines[i].includes('Vencimento') && lines[i + 1]?.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      dueDate = parseShortDate(lines[i + 1], defaultYear)
    }
    if (lines[i].includes('Período das compras') && lines[i + 1]) {
      const pMatch = lines[i + 1].match(/(\d{2}\/\d{2}\/\d{2,4})\s+a\s+(\d{2}\/\d{2}\/\d{2,4})/)
      if (pMatch) {
        periodStart = parseShortDate(pMatch[1], defaultYear)
        periodEnd = parseShortDate(pMatch[2], defaultYear)
      }
    }
  }

  // Parse transactions in "Detalhamento da Fatura"
  const transactions: Transaction[] = []
  let inDetail = false

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.includes('Detalhamento da Fatura')) {
      inDetail = true
      i++
      continue
    }

    if (inDetail) {
      if (line.includes('Juros e Custo Efetivo Total') || line.includes('Encargos')) {
        inDetail = false
        break
      }

      // Check transaction line starting with DD/MM
      const dateMatch = line.match(/^(\d{2}\/\d{2})\s*(.*)$/)
      if (dateMatch) {
        const txDate = parseShortDate(dateMatch[1], defaultYear)
        let restOfLine = dateMatch[2].trim()
        let nextIdx = i + 1

        // Check if next token is installment (e.g. "04/12") followed by amount
        if (
          nextIdx < lines.length &&
          lines[nextIdx].match(/^\d{1,2}\/\d{1,2}$/) &&
          lines[nextIdx + 1]?.match(/^-?\d{1,3}(?:\.\d{3})*,\d{2}$/)
        ) {
          restOfLine += ' ' + lines[nextIdx]
          nextIdx++
        }

        while (
          nextIdx < lines.length &&
          !lines[nextIdx].match(/^-?\d{1,3}(?:\.\d{3})*,\d{2}$/) &&
          !lines[nextIdx].match(/^\d{2}\/\d{2}/) &&
          !lines[nextIdx].includes('VALOR TOTAL')
        ) {
          restOfLine += ' ' + lines[nextIdx]
          nextIdx++
        }

        // Amount
        if (nextIdx < lines.length && lines[nextIdx].match(/^-?\d{1,3}(?:\.\d{3})*,\d{2}$/)) {
          const rawAmountStr = lines[nextIdx]
          let amountCents = parseMoneyStringToCents(rawAmountStr)
          nextIdx++

          // In credit card statements:
          // Payments to invoice are printed negative or labeled PAGAMENTO DE FATURA (which reduces debt, so inflow)
          const isPayment = restOfLine.toLowerCase().includes('pagamento de fatura')
          if (isPayment) {
            amountCents = Math.abs(amountCents)
          } else {
            // Normal purchases are expenses (negative amount)
            amountCents = -Math.abs(amountCents)
          }

          const { kind, categoryId } = classifyTransaction(restOfLine, amountCents, DEFAULT_RULES)
          const instInfo = extractInstallmentInfo(restOfLine)

          transactions.push({
            id: `sant-card-${txDate}-${transactions.length}-${Math.abs(amountCents)}`,
            accountId,
            date: txDate,
            description: restOfLine.trim(),
            rawDescription: restOfLine.trim(),
            amountCents,
            kind: isPayment ? 'card_payment' : kind,
            categoryId,
            installment: instInfo
              ? {
                  current: instInfo.current,
                  total: instInfo.total,
                  groupId: `grp-${instInfo.cleanTitle.toLowerCase().replace(/\s+/g, '-')}`,
                }
              : undefined,
            source: 'pdf',
          })
        }

        i = nextIdx
        continue
      }
    }

    i++
  }

  const statementId = `stmt-${doc.fileHash.slice(0, 12)}`

  return {
    institution: 'santander',
    accountType: 'credit_card',
    accountIdentifier: '0316',
    periodStart: periodStart || (transactions[0]?.date ?? ''),
    periodEnd: periodEnd || (transactions[transactions.length - 1]?.date ?? ''),
    closingBalanceCents: -totalAPagarCents, // Card balance is liability
    transactions: transactions.map((t) => ({ ...t, statementId })),
    statement: {
      id: statementId,
      accountId,
      fileHash: doc.fileHash,
      fileName,
      importedAt: new Date().toISOString(),
      periodStart: periodStart || (transactions[0]?.date ?? ''),
      periodEnd: periodEnd || (transactions[transactions.length - 1]?.date ?? ''),
      invoiceTotalCents: totalAPagarCents,
      dueDate,
      transactionCount: transactions.length,
    },
  }
}
