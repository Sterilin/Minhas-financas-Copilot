import { detectBradesco, parseBradescoPdf, type ParsedBankStatementResult } from './bradescoConta'
import { extractPdfText } from './pdfText'
import { detectSantanderCartao, parseSantanderCartaoPdf } from './santanderCartao'
import { detectSantanderConta, parseSantanderContaPdf } from './santanderConta'

export interface ParsePdfResult {
  fileName: string
  fileHash: string
  detectedBank: string
  confidence: number
  result?: ParsedBankStatementResult
  error?: string
}

/**
 * Automatically inspects, classifies, and parses any Brazilian bank statement or credit card PDF.
 */
export async function autoParsePdf(
  fileBuffer: ArrayBuffer,
  fileName: string,
  password?: string
): Promise<ParsePdfResult> {
  try {
    const doc = await extractPdfText(fileBuffer, password)

    const scores = [
      { name: 'Bradesco Conta', score: detectBradesco(doc), parser: parseBradescoPdf },
      { name: 'Santander Conta', score: detectSantanderConta(doc), parser: parseSantanderContaPdf },
      { name: 'Santander Cartão', score: detectSantanderCartao(doc), parser: parseSantanderCartaoPdf },
    ]

    scores.sort((a, b) => b.score - a.score)
    const best = scores[0]

    if (best.score < 0.5) {
      return {
        fileName,
        fileHash: doc.fileHash,
        detectedBank: 'Desconhecido',
        confidence: best.score,
        error: 'Formato de banco não reconhecido. Suporte atual para Bradesco e Santander.',
      }
    }

    const parsed = best.parser(doc, fileName)

    return {
      fileName,
      fileHash: doc.fileHash,
      detectedBank: best.name,
      confidence: best.score,
      result: parsed,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      fileName,
      fileHash: '',
      detectedBank: 'Erro',
      confidence: 0,
      error: msg,
    }
  }
}
