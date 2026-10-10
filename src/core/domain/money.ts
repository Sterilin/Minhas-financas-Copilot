export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/**
 * Formats an integer amount in cents as BRL currency string (e.g. 159900 -> "R$ 1.599,00")
 */
export function formatCents(cents: number): string {
  const value = cents / 100
  return currencyFormatter.format(value)
}

/**
 * Converts integer cents to a standard float number.
 */
export function centsToNumber(cents: number): number {
  return cents / 100
}

/**
 * Converts a standard float number to integer cents.
 */
export function numberToCents(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Parses typical Brazilian money strings (e.g. "R$ 1.234,56", "1.234,56-", "-1234.56") into integer cents.
 */
export function parseMoneyStringToCents(str: string): number {
  if (!str) return 0
  let clean = str.trim().replace(/[R$\s\xa0]/g, '')
  
  // Detect trailing minus sign (e.g. Santander's "1.239,16-")
  let isNegative = false
  if (clean.endsWith('-')) {
    isNegative = true
    clean = clean.slice(0, -1)
  } else if (clean.startsWith('-')) {
    isNegative = true
    clean = clean.slice(1)
  }

  // Handle thousand dots and decimal comma
  if (clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.')
  }

  const num = parseFloat(clean)
  if (isNaN(num)) return 0

  const cents = Math.round(num * 100)
  return isNegative ? -cents : cents
}
