import { describe, it, expect } from 'vitest'
import { SEED_FINANCE_BASE } from '../data/seedBase'
import { calculateAccountBalances, calculateDashboardMetrics } from './balances'

describe('calculateDashboardMetrics & calculateAccountBalances', () => {
  it('correctly provides individual bank balances and credit card invoice for September 2026', () => {
    const metrics = calculateDashboardMetrics(SEED_FINANCE_BASE, '2026-09')

    expect(metrics.bradesco).toBeDefined()
    expect(metrics.santanderAcc).toBeDefined()
    expect(metrics.santanderCard).toBeDefined()

    // Bradesco closing balance on 30/09/2026: R$ 47.791,41
    expect(metrics.bradesco!.balanceCents).toBe(4779141)

    // Santander checking closing balance on 22/09/2026: R$ 2.719,62
    expect(metrics.santanderAcc!.balanceCents).toBe(271962)

    // Santander credit card invoice for September 2026: R$ 1.884,07
    expect(metrics.santanderCard!.invoiceCents).toBe(188407)

    // Verify accounts are not summed into a single number
    const balances = calculateAccountBalances(SEED_FINANCE_BASE, '2026-09')
    expect(balances).toHaveLength(3)

    const brad = balances.find((b) => b.account.id === 'acc-bradesco')!
    const sant = balances.find((b) => b.account.id === 'acc-santander-acc')!
    const card = balances.find((b) => b.account.id === 'acc-santander-card')!

    expect(brad.balanceCents).toBe(4779141)
    expect(brad.isCard).toBe(false)

    expect(sant.balanceCents).toBe(271962)
    expect(sant.isCard).toBe(false)

    expect(card.invoiceCents).toBe(188407)
    expect(card.isCard).toBe(true)
  })

  it('correctly provides individual bank balances for August 2026', () => {
    const metrics = calculateDashboardMetrics(SEED_FINANCE_BASE, '2026-08')

    // Bradesco closing balance on 31/08/2026: R$ 45.511,18
    expect(metrics.bradesco!.balanceCents).toBe(4551118)

    // Santander checking closing balance on 25/08/2026: R$ 2.685,51
    expect(metrics.santanderAcc!.balanceCents).toBe(268551)

    // Santander credit card invoice for August 2026: R$ 1.638,28
    expect(metrics.santanderCard!.invoiceCents).toBe(163828)
  })
})
