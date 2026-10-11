import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useFinanceBase } from '../../core/data/FinanceBaseProvider'
import {
  calculateAccountBalances,
  calculateAvailableBalanceProjection,
  calculateDashboardMetrics,
} from '../../core/domain/balances'
import { deriveActiveInstallments } from '../../core/domain/installments'
import { formatCents } from '../../core/domain/money'
import { extractFiscalPeriods, getFiscalPeriod } from '../../core/domain/period'
import { Amount } from '../../ui/Amount'
import { MetricCard } from '../../ui/MetricCard'
import { Money } from '../../ui/Money'
import { PageShell } from '../../ui/PageShell'
import { Panel } from '../../ui/Panel'
import './ResumoPage.css'

export default function ResumoPage() {
  const { base } = useFinanceBase()

  const fiscalPeriods = useMemo(() => {
    if (!base) return []
    return extractFiscalPeriods(base.transactions, base.settings.fiscalStartDay)
  }, [base])

  const defaultPeriodKey = useMemo(() => {
    if (!base || fiscalPeriods.length === 0) return ''
    const latestStmt = base.statements.reduce<string>((max, s) => {
      const k = s.dueDate ? s.dueDate.slice(0, 7) : s.periodEnd.slice(0, 7)
      return k > max ? k : max
    }, '')
    if (latestStmt && fiscalPeriods.some((p) => p.key === latestStmt)) {
      return latestStmt
    }
    return fiscalPeriods[0]?.key || ''
  }, [base, fiscalPeriods])

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('')

  // Keep selected period valid
  const currentPeriodKey = selectedPeriodKey || defaultPeriodKey || fiscalPeriods[0]?.key || ''

  const metrics = useMemo(() => {
    if (!base || !currentPeriodKey) return null
    return calculateDashboardMetrics(base, currentPeriodKey)
  }, [base, currentPeriodKey])

  const accountBalances = useMemo(() => {
    if (!base) return []
    return calculateAccountBalances(base, currentPeriodKey)
  }, [base, currentPeriodKey])

  const activeInstallments = useMemo(() => {
    if (!base) return []
    return deriveActiveInstallments(base.transactions).slice(0, 4)
  }, [base])

  const projection = useMemo(() => {
    if (!base) return null
    return calculateAvailableBalanceProjection(base, currentPeriodKey)
  }, [base, currentPeriodKey])

  // Category spending for selected period
  const categorySpending = useMemo(() => {
    if (!base || !currentPeriodKey) return []
    const txs = base.transactions.filter((t) => {
      const p = getFiscalPeriod(t.date, base.settings.fiscalStartDay)
      return p.key === currentPeriodKey && t.kind === 'expense' && t.amountCents < 0
    })

    const catMap = new Map<string, number>()
    for (const t of txs) {
      const cat = base.categories.find((c) => c.id === t.categoryId)?.name || 'Outros'
      catMap.set(cat, (catMap.get(cat) || 0) + Math.abs(t.amountCents))
    }

    return Array.from(catMap.entries())
      .map(([name, cents]) => ({ name, value: cents / 100, cents }))
      .sort((a, b) => b.cents - a.cents)
      .slice(0, 6)
  }, [base, currentPeriodKey])

  // Monthly flow history (last 6 fiscal months)
  const monthlyFlow = useMemo(() => {
    if (!base) return []
    const reversedPeriods = [...fiscalPeriods].reverse().slice(-6)
    return reversedPeriods.map((p) => {
      const m = calculateDashboardMetrics(base, p.key)
      return {
        label: p.label,
        Receitas: m.periodIncomeCents / 100,
        Despesas: m.periodExpenseCents / 100,
      }
    })
  }, [base, fiscalPeriods])

  if (!base || !metrics) {
    return (
      <PageShell title="Resumo">
        <p>Carregando dados financeiros...</p>
      </PageShell>
    )
  }

  const periodObj = fiscalPeriods.find((p) => p.key === currentPeriodKey)

  return (
    <PageShell
      title="Tranquilidade Financeira"
      description={`Visão detalhada de saldos e resultado fiscal de ${periodObj?.fullLabel || 'período atual'}.`}
      actions={
        <div className="period-selector-container">
          <label htmlFor="period-select" className="period-label">
            Período Fiscal:
          </label>
          <select
            id="period-select"
            className="period-select"
            value={currentPeriodKey}
            onChange={(e) => setSelectedPeriodKey(e.target.value)}
          >
            {fiscalPeriods.map((p) => (
              <option key={p.key} value={p.key}>
                {p.fullLabel} (dia {base.settings.fiscalStartDay} a {base.settings.fiscalStartDay - 1})
              </option>
            ))}
          </select>
        </div>
      }
    >
      {/* Metrics Row: Separate accounts & invoices, no summed balance */}
      <div className="metrics-grid">
        <MetricCard
          label="Saldo Bradesco"
          value={<Money cents={metrics.bradesco?.balanceCents ?? 0} />}
          detail="Conta Corrente • Ag 2297"
          icon={<Wallet size={20} />}
          variant="accent"
        />
        <MetricCard
          label="Saldo Santander"
          value={<Money cents={metrics.santanderAcc?.balanceCents ?? 0} />}
          detail="Conta Corrente • Ag 0040"
          icon={<Wallet size={20} />}
          variant="accent"
        />
        <MetricCard
          label="Fatura Cartão Santander"
          value={<Money cents={metrics.santanderCard?.invoiceCents ?? 0} />}
          detail={`Vencimento: ${metrics.santanderCard?.dueDate || '25'}`}
          icon={<CreditCard size={20} />}
          variant={(metrics.santanderCard?.invoiceCents ?? 0) > 0 ? 'negative' : 'default'}
        />
        <MetricCard
          label="Resultado do Mês"
          value={<Amount cents={metrics.periodResultCents} showSign={true} />}
          detail={`Receitas: ${formatCents(metrics.periodIncomeCents)} • Despesas: ${formatCents(metrics.periodExpenseCents)}`}
          icon={metrics.periodResultCents >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
          variant={metrics.periodResultCents >= 0 ? 'positive' : 'negative'}
        />
      </div>
 
      {/* Box / Panel: Disponibilidade para Investimento e Gastos */}
      {projection && (
        <Panel
          className="projection-panel"
          title="Disponibilidade para Investimento e Gastos"
          subtitle="Saldo total disponível em bancos descontando o provisionamento para despesas futuras de cartões e parcelamentos"
        >
          {/* Top highlight indicators */}
          <div className="projection-highlights">
            <div className="projection-highlight-item">
              <span className="proj-hl-label">Saldo Total em Bancos</span>
              <strong className="proj-hl-value font-mono">
                <Money cents={projection.totalBankBalanceCents} />
              </strong>
              <span className="proj-hl-detail">Bradesco + Santander Conta</span>
            </div>

            <div className="projection-highlight-item hl-committed">
              <span className="proj-hl-label">Despesas Futuras Comprometidas</span>
              <strong className="proj-hl-value font-mono text-negative">
                <Money cents={projection.totalCommittedCents} />
              </strong>
              <span className="proj-hl-detail">
                Média 3 meses ({formatCents(projection.card3MonthAvgCents)}) + Parcelas ({formatCents(projection.totalUnpaidInstallmentsCents)})
              </span>
            </div>

            <div className="projection-highlight-item hl-free">
              <span className="proj-hl-label">Saldo Livre Disponível</span>
              <strong className="proj-hl-value font-mono text-positive">
                <Money cents={projection.freeBalanceCents} />
              </strong>
              <span className="proj-hl-detail">
                {projection.freeRatioPercent.toFixed(1)}% livre para investir ou poupar
              </span>
            </div>
          </div>

          {/* Horizontal Striped Bar Chart */}
          <div className="projection-chart-container">
            <div className="projection-bar-wrapper">
              <div
                className="projection-bar-fill bar-fill-free"
                style={{ width: `${projection.freeRatioPercent}%` }}
                title={`Saldo Livre: ${formatCents(projection.freeBalanceCents)} (${projection.freeRatioPercent.toFixed(1)}%)`}
              >
                {projection.freeRatioPercent >= 18 && (
                  <span className="bar-inner-label">
                    Livre: {formatCents(projection.freeBalanceCents)} ({projection.freeRatioPercent.toFixed(1)}%)
                  </span>
                )}
              </div>
              <div
                className="projection-bar-fill bar-fill-committed striped-committed"
                style={{ width: `${projection.committedRatioPercent}%` }}
                title={`Comprometido Futuro: ${formatCents(projection.totalCommittedCents)} (${projection.committedRatioPercent.toFixed(1)}%)`}
              >
                {projection.committedRatioPercent >= 8 && (
                  <span className="bar-inner-label">
                    {projection.committedRatioPercent.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* Legend underneath bar */}
            <div className="projection-bar-legend">
              <div className="legend-entry">
                <span className="legend-indicator legend-indicator-free" />
                <span className="legend-text">
                  <strong>Saldo Livre Disponível:</strong> {formatCents(projection.freeBalanceCents)} ({projection.freeRatioPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="legend-entry">
                <span className="legend-indicator legend-indicator-striped striped-committed" />
                <span className="legend-text">
                  <strong>Alocado para Despesas Futuras:</strong> {formatCents(projection.totalCommittedCents)} ({projection.committedRatioPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Descriptive Table Below the Bar */}
          <div className="projection-table-wrapper">
            <h4 className="projection-table-title">Detalhamento dos Valores</h4>
            <div className="table-wrapper">
              <table className="projection-table">
                <thead>
                  <tr>
                    <th>Componente / Origem</th>
                    <th>Classificação</th>
                    <th className="align-right">Valor</th>
                    <th className="align-right">% do Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Bank accounts breakdown */}
                  {accountBalances
                    .filter((a) => !a.isCard)
                    .map((accInfo) => (
                      <tr key={accInfo.account.id}>
                        <td>
                          <div className="table-item-cell">
                            <strong>{accInfo.account.name}</strong>
                            <span className="table-item-sub">
                              Saldo em conta corrente (Final {accInfo.account.identifier})
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-accent">Saldo Bancário</span>
                        </td>
                        <td className="align-right font-mono">
                          <Money cents={accInfo.balanceCents} />
                        </td>
                        <td className="align-right font-mono text-muted">
                          {projection.totalBankBalanceCents > 0
                            ? `${((accInfo.balanceCents / projection.totalBankBalanceCents) * 100).toFixed(1)}%`
                            : '—'}
                        </td>
                      </tr>
                    ))}

                  {/* Subtotal Bank balance */}
                  <tr className="table-subtotal-row">
                    <td>
                      <strong>Total Disponível em Bancos</strong>
                    </td>
                    <td>
                      <span className="badge badge-positive">Disponibilidade Bruta</span>
                    </td>
                    <td className="align-right font-mono">
                      <strong>
                        <Money cents={projection.totalBankBalanceCents} />
                      </strong>
                    </td>
                    <td className="align-right font-mono">
                      <strong>100,0%</strong>
                    </td>
                  </tr>

                  {/* 3-Month Credit Card Average */}
                  <tr>
                    <td>
                      <div className="table-item-cell">
                        <strong>Média de Gastos nos Cartões (Últimos 3 Meses)</strong>
                        <span className="table-item-sub">
                          {projection.cardMonthsEvaluated.length > 0
                            ? projection.cardMonthsEvaluated
                                .map(
                                  (m) =>
                                    `${m.monthKey.slice(5)}/${m.monthKey.slice(2, 4)}: ${formatCents(m.amountCents)}`
                                )
                                .join(' • ')
                            : 'Provisionamento para fatura do mês subsequente'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-striped">Média Futura Cartões</span>
                    </td>
                    <td className="align-right font-mono text-negative">
                      <Amount cents={-projection.card3MonthAvgCents} />
                    </td>
                    <td className="align-right font-mono text-negative">
                      {projection.totalBankBalanceCents > 0
                        ? `-${((projection.card3MonthAvgCents / projection.totalBankBalanceCents) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>

                  {/* Unpaid installments */}
                  <tr>
                    <td>
                      <div className="table-item-cell">
                        <strong>Parcelas de Cartão Não Quitadas</strong>
                        <span className="table-item-sub">
                          {projection.activeInstallmentsCount > 0
                            ? `${projection.activeInstallmentsCount} compra(s) parcelada(s) com parcelas a vencer`
                            : 'Sem parcelamentos ativos a vencer'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-striped">Parcelas a Vencer</span>
                    </td>
                    <td className="align-right font-mono text-negative">
                      <Amount cents={-projection.totalUnpaidInstallmentsCents} />
                    </td>
                    <td className="align-right font-mono text-negative">
                      {projection.totalBankBalanceCents > 0
                        ? `-${((projection.totalUnpaidInstallmentsCents / projection.totalBankBalanceCents) * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>

                  {/* Total Committed */}
                  <tr className="table-subtotal-row table-subtotal-negative">
                    <td>
                      <strong>Total Futuro Comprometido</strong>
                      <span className="table-item-sub">
                        Média cartões + todas as parcelas restantes
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-negative">Total Comprometido</span>
                    </td>
                    <td className="align-right font-mono text-negative">
                      <strong>
                        <Amount cents={-projection.totalCommittedCents} />
                      </strong>
                    </td>
                    <td className="align-right font-mono text-negative">
                      <strong>-{projection.committedRatioPercent.toFixed(1)}%</strong>
                    </td>
                  </tr>

                  {/* Final Net Free Balance */}
                  <tr className="table-total-row">
                    <td>
                      <div className="table-item-cell">
                        <strong className="table-item-highlight">
                          Saldo Livre para Investimento ou Gastos
                        </strong>
                        <span className="table-item-sub">
                          Margem real segura para aplicação ou novos gastos
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-positive">Margem Livre</span>
                    </td>
                    <td className="align-right font-mono text-positive table-total-amount">
                      <strong>
                        <Money cents={projection.freeBalanceCents} />
                      </strong>
                    </td>
                    <td className="align-right font-mono text-positive table-total-percent">
                      <strong>{projection.freeRatioPercent.toFixed(1)}%</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      {/* Main Content Grid */}
      <div className="resumo-grid">
        {/* Account Balances */}
        <Panel
          title="Saldos e Faturas por Conta"
          subtitle={`Valores apurados individualmente nos extratos de ${periodObj?.label || 'período atual'}`}
        >
          <ul className="account-list">
            {accountBalances.map((info) => (
              <li key={info.account.id} className="account-row">
                <div className="account-info">
                  <strong className="account-name">{info.account.name}</strong>
                  <span className="account-sub">
                    {info.isCard
                      ? `Cartão de crédito • Vencimento ${info.dueDate || '25'}`
                      : `Conta corrente • Final ${info.account.identifier}`}
                  </span>
                </div>
                <div className="account-balance">
                  {info.isCard ? (
                    <span className="amount amount-negative">
                      {formatCents(info.invoiceCents ?? 0)}
                    </span>
                  ) : (
                    <Money cents={info.balanceCents} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Category Breakdown */}
        <Panel
          title="Gastos por Categoria"
          subtitle={`Distribuição das despesas em ${periodObj?.label}`}
        >
          {categorySpending.length === 0 ? (
            <p className="empty-notice">Nenhuma despesa registrada neste período.</p>
          ) : (
            <div className="category-chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categorySpending}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {categorySpending.map((_entry, index) => {
                      const colors = ['#B08968', '#4E6E4A', '#ACBD5E', '#D4A365', '#5C4033', '#8C827A']
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    })}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => formatCents(Math.round(Number(val ?? 0) * 100))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="category-legend">
                {categorySpending.map((item, idx) => {
                  const colors = ['#B08968', '#4E6E4A', '#ACBD5E', '#D4A365', '#5C4033', '#8C827A']
                  return (
                    <div key={item.name} className="legend-item">
                      <span className="legend-dot" style={{ backgroundColor: colors[idx % colors.length] }} />
                      <span className="legend-name">{item.name}</span>
                      <strong className="legend-val">{formatCents(item.cents)}</strong>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Cash Flow History */}
      <Panel
        title="Fluxo de Caixa (Últimos 6 Ciclos)"
        subtitle="Evolução comparativa de receitas e despesas por mês fiscal"
      >
        <div className="flow-chart-container">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyFlow} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={12}
                tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v: any) => formatCents(Math.round(Number(v ?? 0) * 100))} />
              <Bar dataKey="Receitas" fill="var(--positive)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Despesas" fill="var(--negative)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Upcoming Installments Preview */}
      {activeInstallments.length > 0 && (
        <Panel
          title="Próximos Compromissos Parcelados"
          subtitle="Compras no cartão com parcelas a vencer"
        >
          <div className="installments-preview-grid">
            {activeInstallments.map((inst) => (
              <div key={inst.id} className="installment-preview-card">
                <div className="inst-header">
                  <strong>{inst.title}</strong>
                  <span className="badge badge-accent">
                    {inst.currentInstallment}/{inst.totalInstallments}
                  </span>
                </div>
                <div className="inst-values">
                  <span>Parcela: {formatCents(inst.installmentAmountCents)}</span>
                  <span>Restante: {formatCents(inst.remainingAmountCents)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </PageShell>
  )
}
