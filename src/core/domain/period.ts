export const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

export const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export interface FiscalPeriod {
  year: number
  month: number // 0-indexed (0 = Jan, 11 = Dez)
  label: string // e.g. "Set/26"
  fullLabel: string // e.g. "Setembro de 2026"
  key: string // e.g. "2026-09"
}

/**
 * Given a date or ISO string (YYYY-MM-DD), determines which fiscal month it belongs to.
 * By default in this system, the fiscal month runs from day 16 of previous month to day 15 of current month.
 * If day >= 16, it advances to the next month.
 */
export function getFiscalPeriod(dateInput: Date | string, startDay = 16): FiscalPeriod {
  let date: Date
  if (typeof dateInput === 'string') {
    // If format is YYYY-MM-DD
    const parts = dateInput.slice(0, 10).split('-')
    if (parts.length === 3) {
      date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    } else {
      date = new Date(dateInput)
    }
  } else {
    date = dateInput
  }

  let y = date.getFullYear()
  let m = date.getMonth()
  const day = date.getDate()

  if (day >= startDay) {
    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }

  const shortMonth = MONTHS_SHORT[m]
  const fullMonth = MONTHS_FULL[m]
  const shortYear = y.toString().slice(-2)

  return {
    year: y,
    month: m,
    label: `${shortMonth}/${shortYear}`,
    fullLabel: `${fullMonth} de ${y}`,
    key: `${y}-${String(m + 1).padStart(2, '0')}`,
  }
}

/**
 * Returns the start and end dates (inclusive) for a given fiscal period (year and 0-indexed month).
 */
export function getFiscalDateRange(year: number, month: number, startDay = 16): { start: Date; end: Date } {
  // Start: (month - 1) at startDay
  let prevM = month - 1
  let prevY = year
  if (prevM < 0) {
    prevM = 11
    prevY -= 1
  }

  const start = new Date(prevY, prevM, startDay, 0, 0, 0)
  const end = new Date(year, month, startDay - 1, 23, 59, 59)

  return { start, end }
}

/**
 * Extracts and sorts all unique fiscal periods found in a list of transactions.
 */
export function extractFiscalPeriods(
  dates: Array<{ date: string }>,
  startDay = 16
): FiscalPeriod[] {
  const map = new Map<string, FiscalPeriod>()

  for (const item of dates) {
    if (!item.date) continue
    const p = getFiscalPeriod(item.date, startDay)
    if (!map.has(p.key)) {
      map.set(p.key, p)
    }
  }

  // Sort descending (most recent first)
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key))
}
