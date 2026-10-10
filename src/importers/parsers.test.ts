import { describe, expect, it } from 'vitest'
import { detectBradesco, parseBradescoPdf } from './bradescoConta'
import type { ExtractedPdfDocument } from './pdfText'
import { detectSantanderCartao, parseSantanderCartaoPdf } from './santanderCartao'
import { detectSantanderConta, parseSantanderContaPdf } from './santanderConta'

describe('Bank PDF Parsers & Detectors', () => {
  it('detects and parses Bradesco statement lines with balance reconciliation', () => {
    const sampleDoc: ExtractedPdfDocument = {
      numPages: 1,
      fileHash: 'dummyhash123',
      allLines: [
        'Bradesco Celular',
        'Nome: PEDRO GIOIA MARTINS',
        'Extrato de: Agência: 2297 | Conta: 18115-3 | Movimentação entre: 01/01/2026 e 31/01/2026',
        'Data',
        'Histórico',
        'Docto.',
        'Crédito (R$)',
        'Débito (R$)',
        'Saldo (R$)',
        '31/12/2025',
        'COD. LANC. 0',
        '0,00',
        '21.578,53',
        '27/01/2026',
        'RENTAB.INVEST FACILCRED*',
        '0303204',
        '2,83',
        '21.581,36',
        '27/01/2026',
        'PIX ENVIADO DES: PEDRO GIOIA MARTINS 27/01',
        '1853088',
        '1.599,00',
        '19.982,36',
        'Total',
        '4.738,55',
        '1.599,00',
        '24.718,08',
      ],
      fullText:
        'Bradesco Celular Extrato de: Agência: 2297 | Conta: 18115-3 Movimentação entre: 01/01/2026 e 31/01/2026 Saldo (R$)',
      pages: [],
    }

    expect(detectBradesco(sampleDoc)).toBeGreaterThanOrEqual(0.8)

    const parsed = parseBradescoPdf(sampleDoc, 'Banco-Brad-jan-26.pdf')
    expect(parsed.institution).toBe('bradesco')
    expect(parsed.accountIdentifier).toBe('18115-3')
    expect(parsed.openingBalanceCents).toBe(2157853)
    expect(parsed.closingBalanceCents).toBe(2471808) // Exact ending amount
    expect(parsed.transactions.length).toBe(2)

    // Check second transaction is debit (PIX enviado)
    const pixTx = parsed.transactions[1]
    expect(pixTx.amountCents).toBe(-159900)
    expect(pixTx.kind).toBe('transfer') // Detected as internal transfer
  })

  it('detects and parses Santander Card with installments', () => {
    const cardDoc: ExtractedPdfDocument = {
      numPages: 2,
      fileHash: 'cardhash999',
      allLines: [
        'Olá, Pedro! Esta é a fatura do seu cartão SANTANDER ELITE MASTERCARD',
        'Total a Pagar',
        'R$ 1.884,07',
        'Vencimento',
        '25/09/2026',
        'Período das compras',
        '19/08/26 a 18/09/26',
        'Detalhamento da Fatura',
        '18/09 ANUIDADE DIFERENCIADA',
        '04/12',
        '22,00',
        '17/08 A LAREIRA RESTAURANTE',
        '23,80',
        '20/08 PAGAMENTO DE FATURA-INTERNET',
        '-1.638,28',
      ],
      fullText:
        'fatura do seu cartão SANTANDER ELITE MASTERCARD Total a Pagar R$ 1.884,07 Detalhamento da Fatura',
      pages: [],
    }

    expect(detectSantanderCartao(cardDoc)).toBe(1.0)

    const parsed = parseSantanderCartaoPdf(cardDoc, 'Cartao-sant-set-26.pdf')
    expect(parsed.institution).toBe('santander')
    expect(parsed.accountType).toBe('credit_card')
    expect(parsed.statement.invoiceTotalCents).toBe(188407)

    const anuidade = parsed.transactions.find((t) => t.description.includes('ANUIDADE'))
    expect(anuidade).toBeDefined()
    expect(anuidade?.installment).toEqual({
      current: 4,
      total: 12,
      groupId: 'grp-anuidade-diferenciada',
    })

    const pagto = parsed.transactions.find((t) => t.description.includes('PAGAMENTO'))
    expect(pagto?.kind).toBe('card_payment')
  })

  it('detects and parses Santander Conta Corrente', () => {
    const santDoc: ExtractedPdfDocument = {
      numPages: 1,
      fileHash: 'santhash555',
      allLines: [
        'EXTRATO CONSOLIDADO INTELIGENTE',
        'Conta Corrente 01.095863-6',
        'Saldo de Conta Corrente em 31/12',
        '3.226,29',
        'Saldo de Conta Corrente em 31/01',
        '1.854,47',
        'Conta Corrente',
        'Movimentação',
        'SALDO EM 31/12',
        '3.226,29',
        '19/01',
        'PIX ENVIADO Leonardo Blanco Natis',
        '1.239,16-',
        '1.963,72',
      ],
      fullText:
        'EXTRATO CONSOLIDADO INTELIGENTE santander Conta Corrente 01.095863-6 Saldo de Conta Corrente',
      pages: [],
    }

    expect(detectSantanderConta(santDoc)).toBe(1.0)
    const parsed = parseSantanderContaPdf(santDoc, 'Banco-san-jan-26.pdf')
    expect(parsed.institution).toBe('santander')
    expect(parsed.accountIdentifier).toBe('01.095863-6')
    expect(parsed.transactions.length).toBe(1)
    expect(parsed.transactions[0].amountCents).toBe(-123916)
  })
})
