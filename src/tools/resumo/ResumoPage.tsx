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

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>(() => {
    return fiscalPeriods[0]?.key || ''
  })

  // Keep selected period valid
  const currentPeriodKey = selectedPeriodKey || fiscalPeriods[0]?.key || ''

  const metrics = useMemo(() => {
    if (!base || !currentPeriodKey) return null
    return calculateDashboardMetrics(base, currentPeriodKey)
  }, [base, currentPeriodKey])

  const accountBalances = useMemo(() => {
    if (!base) return []
    return calculateAccountBalances(base)
  }, [base])

  const activeInstallments = useMemo(() => {
    if (!base) return []
    return deriveActiveInstallments(base.transactions).slice(0, 4)
  }, [base])

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
      description={`Visão consolidada do patrimônio e resultado fiscal de ${periodObj?.fullLabel || 'período atual'}.`}
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
      {/* Metrics Row */}
      <div className="metrics-grid">
        <MetricCard
          label="Saldo Consolidado"
          value={<Money cents={metrics.consolidatedBalanceCents} />}
          detail="Contas correntes e cartões deduzidos"
          icon={<Wallet size={20} />}
          variant="accent"
        />
        <MetricCard
          label="Fatura de Cartão"
          value={<Money cents={metrics.creditCardOpenInvoiceCents} />}
          detail="Compromissos em aberto"
          icon={<CreditCard size={20} />}
          variant={metrics.creditCardOpenInvoiceCents > 0 ? 'negative' : 'default'}
        />
        <MetricCard
          label="Receitas do Mês"
          value={<Amount cents={metrics.periodIncomeCents} showSign={false} />}
          detail="Entradas reais no período"
          icon={<ArrowUpRight size={20} />}
          variant="positive"
        />
        <MetricCard
          label="Despesas do Mês"
          value={<Amount cents={-metrics.periodExpenseCents} showSign={false} />}
          detail={`Resultado líquido: ${formatCents(metrics.periodResultCents)}`}
          icon={<ArrowDownRight size={20} />}
          variant="negative"
        />
      </div>

      {/* Main Content Grid */}
      <div className="resumo-grid">
        {/* Account Balances */}
        <Panel title="Patrimônio por Conta" subtitle="Saldo apurado com conciliação automática">
          <ul className="account-list">
            {accountBalances.map((info) => (
              <li key={info.account.id} className="account-row">
                <div className="account-info">
                  <strong className="account-name">{info.account.name}</strong>
                  <span className="account-sub">
                    {info.account.type === 'credit_card' ? 'Cartão de crédito' : 'Conta corrente'} • Final{' '}
                    {info.account.identifier}
                  </span>
                </div>
                <div className="account-balance">
                  <Amount cents={info.balanceCents} showSign={false} />
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
