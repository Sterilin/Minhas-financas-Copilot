import { useMemo, useState } from 'react'
import { useFinanceBase } from '../../core/data/FinanceBaseProvider'
import { formatCents } from '../../core/domain/money'
import { extractFiscalPeriods, getFiscalPeriod } from '../../core/domain/period'
import { Amount } from '../../ui/Amount'
import { MetricCard } from '../../ui/MetricCard'
import { Money } from '../../ui/Money'
import { PageShell } from '../../ui/PageShell'
import { Panel } from '../../ui/Panel'
import './ComparativoPage.css'

interface CategoryComparisonRow {
  categoryName: string
  periodACents: number
  periodBCents: number
  diffCents: number
  percentChange: number
}

export default function ComparativoPage() {
  const { base } = useFinanceBase()

  const fiscalPeriods = useMemo(() => {
    if (!base) return []
    return extractFiscalPeriods(base.transactions, base.settings.fiscalStartDay)
  }, [base])

  // Default: Period B = latest, Period A = previous month
  const [periodBKey, setPeriodBKey] = useState<string>(() => fiscalPeriods[0]?.key || '')
  const [periodAKey, setPeriodAKey] = useState<string>(() => fiscalPeriods[1]?.key || '')

  const effectivePeriodB = periodBKey || fiscalPeriods[0]?.key || ''
  const effectivePeriodA = periodAKey || fiscalPeriods[1]?.key || fiscalPeriods[0]?.key || ''

  const periodAObj = fiscalPeriods.find((p) => p.key === effectivePeriodA)
  const periodBObj = fiscalPeriods.find((p) => p.key === effectivePeriodB)

  const comparisonData = useMemo(() => {
    if (!base) return { rows: [], totalA: 0, totalB: 0, totalDiff: 0, totalPercent: 0 }

    const sumExpensesByCat = (periodKey: string) => {
      const map = new Map<string, number>()
      const txs = base.transactions.filter((t) => {
        const p = getFiscalPeriod(t.date, base.settings.fiscalStartDay)
        return p.key === periodKey && t.kind === 'expense' && t.amountCents < 0
      })
      for (const t of txs) {
        const cat = base.categories.find((c) => c.id === t.categoryId)?.name || 'Outros'
        map.set(cat, (map.get(cat) || 0) + Math.abs(t.amountCents))
      }
      return map
    }

    const mapA = sumExpensesByCat(effectivePeriodA)
    const mapB = sumExpensesByCat(effectivePeriodB)

    const allCategories = Array.from(new Set([...mapA.keys(), ...mapB.keys()]))

    let totalA = 0
    let totalB = 0

    const rows: CategoryComparisonRow[] = allCategories.map((catName) => {
      const a = mapA.get(catName) || 0
      const b = mapB.get(catName) || 0
      totalA += a
      totalB += b

      const diff = b - a
      const percent = a > 0 ? Math.round((diff / a) * 100) : b > 0 ? 100 : 0

      return {
        categoryName: catName,
        periodACents: a,
        periodBCents: b,
        diffCents: diff,
        percentChange: percent,
      }
    })

    rows.sort((a, b) => b.periodBCents - a.periodBCents)

    const totalDiff = totalB - totalA
    const totalPercent = totalA > 0 ? Math.round((totalDiff / totalA) * 100) : 0

    return { rows, totalA, totalB, totalDiff, totalPercent }
  }, [base, effectivePeriodA, effectivePeriodB])

  if (!base) {
    return (
      <PageShell title="Comparativo">
        <p>Carregando dados financeiros...</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Comparativo de Ciclos"
      description="Compare o desempenho e as variações de gastos entre dois períodos fiscais selecionados."
    >
      {/* Period Selection Controls */}
      <div className="comparison-controls-panel">
        <div className="period-box">
          <label htmlFor="period-a-select" className="control-label">
            Período Base (A):
          </label>
          <select
            id="period-a-select"
            className="control-select"
            value={effectivePeriodA}
            onChange={(e) => setPeriodAKey(e.target.value)}
          >
            {fiscalPeriods.map((p) => (
              <option key={`a-${p.key}`} value={p.key}>
                {p.fullLabel}
              </option>
            ))}
          </select>
        </div>

        <div className="vs-divider">VS</div>

        <div className="period-box">
          <label htmlFor="period-b-select" className="control-label">
            Período Comparado (B):
          </label>
          <select
            id="period-b-select"
            className="control-select"
            value={effectivePeriodB}
            onChange={(e) => setPeriodBKey(e.target.value)}
          >
            {fiscalPeriods.map((p) => (
              <option key={`b-${p.key}`} value={p.key}>
                {p.fullLabel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="metrics-grid">
        <MetricCard
          label={`Total Período A (${periodAObj?.label || 'A'})`}
          value={<Money cents={comparisonData.totalA} />}
          detail="Gastos apurados no período base"
        />
        <MetricCard
          label={`Total Período B (${periodBObj?.label || 'B'})`}
          value={<Money cents={comparisonData.totalB} />}
          detail="Gastos apurados no período comparado"
        />
        <MetricCard
          label="Variação Total"
          value={
            <span
              className={
                comparisonData.totalDiff <= 0 ? 'amount-positive' : 'amount-negative'
              }
            >
              <span className="val-privacy">
                {comparisonData.totalDiff > 0 ? '+' : ''}
                {comparisonData.totalPercent}% (<span className="money">{formatCents(comparisonData.totalDiff)}</span>)
              </span>
            </span>
          }
          detail={
            comparisonData.totalDiff <= 0
              ? 'Economia em relação ao período anterior'
              : 'Aumento nos gastos gerais'
          }
          variant={comparisonData.totalDiff <= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Comparison Table */}
      <Panel
        title="Análise Detalhada por Categoria"
        subtitle="Verde indica redução de gastos; vermelho indica aumento."
      >
        <div className="table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th className="align-right">Período A ({periodAObj?.label})</th>
                <th className="align-right">Período B ({periodBObj?.label})</th>
                <th className="align-right">Diferença (R$)</th>
                <th className="align-right">Variação (%)</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.rows.map((row) => {
                const isEconomy = row.diffCents <= 0
                return (
                  <tr key={row.categoryName}>
                    <td className="font-semibold">{row.categoryName}</td>
                    <td className="align-right">
                      <Money cents={row.periodACents} />
                    </td>
                    <td className="align-right">
                      <Money cents={row.periodBCents} />
                    </td>
                    <td className="align-right">
                      <Amount cents={row.diffCents} showSign={true} />
                    </td>
                    <td className="align-right">
                      <span
                        className={`badge ${
                          isEconomy ? 'badge-positive' : 'badge-negative'
                        } val-privacy`}
                      >
                        {row.percentChange > 0 ? '+' : ''}
                        {row.percentChange}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageShell>
  )
}
