import { describe, expect, it } from 'vitest'
import {
  centsToNumber,
  formatCents,
  numberToCents,
  parseMoneyStringToCents,
} from './money'

describe('Domain: money.ts', () => {
  it('formats cents into BRL currency string', () => {
    expect(formatCents(159900)).toMatch(/R\$\s*1\.599,00/)
    expect(formatCents(0)).toMatch(/R\$\s*0,00/)
    expect(formatCents(-238050)).toMatch(/-?R\$\s*2\.380,50/)
  })

  it('converts cents to number and back', () => {
    expect(centsToNumber(1250)).toBe(12.5)
    expect(numberToCents(12.5)).toBe(1250)
  })

  it('parses typical Brazilian bank strings', () => {
    expect(parseMoneyStringToCents('1.239,16-')).toBe(-123916)
    expect(parseMoneyStringToCents('R$ 2.416,75')).toBe(241675)
    expect(parseMoneyStringToCents(' 0,09 ')).toBe(9)
    expect(parseMoneyStringToCents('4.735,72')).toBe(473572)
    expect(parseMoneyStringToCents('-150.00')).toBe(-15000)
  })
})
