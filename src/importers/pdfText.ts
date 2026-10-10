import * as pdfjsLib from 'pdfjs-dist'

export interface ExtractedPageText {
  pageNumber: number
  text: string
  lines: string[]
}

export interface ExtractedPdfDocument {
  numPages: number
  fileHash: string
  allLines: string[]
  fullText: string
  pages: ExtractedPageText[]
}

/**
 * Computes SHA-256 hash of an ArrayBuffer in hex format.
 */
export async function computeFileHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Extracts all lines of text from an uploaded PDF file buffer.
 */
export async function extractPdfText(
  fileBuffer: ArrayBuffer,
  password?: string
): Promise<ExtractedPdfDocument> {
  const fileHash = await computeFileHash(fileBuffer)

  // Configure worker if needed; in Vite, pdfjs-dist can run with standard font or inline worker
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer),
    password,
  })

  const doc = await loadingTask.promise
  const pages: ExtractedPageText[] = []
  const allLines: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const textContent = await page.getTextContent()

    // Collect strings
    const items = textContent.items
      .map((item) => ('str' in item ? item.str.trim() : ''))
      .filter((s) => s.length > 0)

    pages.push({
      pageNumber: i,
      text: items.join(' '),
      lines: items,
    })

    allLines.push(...items)
  }

  const fullText = allLines.join('\n')

  return {
    numPages: doc.numPages,
    fileHash,
    allLines,
    fullText,
    pages,
  }
}
