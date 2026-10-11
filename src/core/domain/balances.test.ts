import { describe, it, expect } from 'vitest'
import { SEED_FINANCE_BASE } from '../data/seedBase'
import {
  calculateAccountBalances,
  calculateAvailableBalanceProjection,
  calculateDashboardMetrics,
} from './balances'

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

  it('correctly calculates available balance projection and future commitments', () => {
    const projection = calculateAvailableBalanceProjection(SEED_FINANCE_BASE, '2026-09')

    // Bank balances: Bradesco (4779141) + Santander (271962) = 5051103 (R$ 50.511,03)
    expect(projection.totalBankBalanceCents).toBe(5051103)

    // 3-month average of Santander Card (Set: 188407, Ago: 163828, Jul: 166787) -> 173007
    expect(projection.card3MonthAvgCents).toBe(173007)
    expect(projection.cardMonthsEvaluated).toHaveLength(3)

    // Unpaid installments: 1 active plan with 8 remaining installments of R$ 22,00 = 17600
    expect(projection.totalUnpaidInstallmentsCents).toBe(17600)

    // Total committed: 173007 + 17600 = 190607 (R$ 1.906,07)
    expect(projection.totalCommittedCents).toBe(190607)

    // Free balance: 5051103 - 190607 = 4860496 (R$ 48.604,96)
    expect(projection.freeBalanceCents).toBe(4860496)

    // Ratios
    expect(projection.committedRatioPercent).toBeCloseTo(3.8, 1)
    expect(projection.freeRatioPercent).toBeCloseTo(96.2, 1)
  })
})

