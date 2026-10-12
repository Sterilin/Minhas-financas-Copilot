import { describe, expect, it } from 'vitest'
import { extractFiscalPeriods, getFiscalPeriod } from './period'

describe('Domain: period.ts', () => {
  it('correctly calculates fiscal period before day 16', () => {
    // 15/09/2026 belongs to Set/26
    const p1 = getFiscalPeriod('2026-09-15', 16)
    expect(p1.label).toBe('Set/26')
    expect(p1.month).toBe(8) // 0-indexed: Sept = 8
    expect(p1.year).toBe(2026)
  })

  it('correctly advances fiscal period on or after day 16', () => {
    // 16/09/2026 belongs to Out/26
    const p2 = getFiscalPeriod('2026-09-16', 16)
    expect(p2.label).toBe('Out/26')
    expect(p2.month).toBe(9) // Oct = 9
    expect(p2.year).toBe(2026)
  })

  it('handles year rollover (Dec 16 -> Jan of next year)', () => {
    const p3 = getFiscalPeriod('2025-12-16', 16)
    expect(p3.label).toBe('Jan/26')
    expect(p3.month).toBe(0)
    expect(p3.year).toBe(2026)
  })

  it('extracts unique periods sorted descending', () => {
    const txs = [
      { date: '2026-01-10' }, // Jan/26
      { date: '2026-01-20' }, // Fev/26
      { date: '2026-09-10' }, // Set/26
    ]
    const periods = extractFiscalPeriods(txs, 16)
    expect(periods.map((p) => p.label)).toEqual(['Set/26', 'Fev/26', 'Jan/26'])
  })
})
