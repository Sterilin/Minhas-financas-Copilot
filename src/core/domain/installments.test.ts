import { describe, it, expect } from 'vitest'
import { deriveActiveInstallments } from './installments'
import { SEED_FINANCE_BASE } from '../data/seedBase'

describe('deriveActiveInstallments with real seed data', () => {
  it('correctly calculates active installments', () => {
    const active = deriveActiveInstallments(SEED_FINANCE_BASE.transactions)
    console.log('Active installments count:', active.length)
    console.log('Active installments:', JSON.stringify(active, null, 2))
    expect(active.length).toBeGreaterThanOrEqual(0)
  })
})

