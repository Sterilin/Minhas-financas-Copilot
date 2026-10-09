import { MetricCard } from '../../components/MetricCard'
import { PageShell } from '../../components/PageShell'
import { demoAccounts, demoGoals, demoInstallments, demoInvoices } from '../../data/demoData'
import { calculateAverageInvoice, calculateNetWorth, calculateReservedAmount, formatCurrency, getUpcomingInstallments } from '../../domain/finance'

export function SummaryPage() {
  const totalNetWorth = calculateNetWorth(demoAccounts)
  const averageInvoice = calculateAverageInvoice(demoInvoices.map((invoice) => invoice.total))
  const reservedAmount = calculateReservedAmount(demoGoals)
  const upcoming = getUpcomingInstallments(demoInstallments)

  return (
    <PageShell
      title="Resumo"
      description="Resumo demonstrativo de patrimônio, compromissos e faturas com dados fictícios para estruturação da aplicação."
    >
      <div className="metrics-grid">
        <MetricCard label="Saldo consolidado" value={formatCurrency(totalNetWorth)} detail="contas e cartão" />
        <MetricCard label="Reserva planejada" value={formatCurrency(reservedAmount)} detail="valor acumulado em metas" />
        <MetricCard label="Média das últimas faturas" value={formatCurrency(averageInvoice)} detail="3 ciclos demonstrativos" />
        <MetricCard label="Compromissos futuros" value={`${upcoming.length} parcelas`} detail="próximos vencimentos" />
      </div>

      <div className="content-grid">
        <section className="panel">
          <h2>Patrimônio por conta</h2>
          <ul className="list-stack">
            {demoAccounts.map((account) => (
              <li key={account.id} className="list-row">
                <div>
                  <strong>{account.name}</strong>
                  <small>{account.type}</small>
                </div>
                <span>{formatCurrency(account.balance)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Próximas parcelas</h2>
          <ul className="list-stack compact">
            {upcoming.map((installment) => (
              <li key={installment.id} className="list-row">
                <div>
                  <strong>{installment.title}</strong>
                  <small>{installment.dueDate}</small>
                </div>
                <span>{installment.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2>Indicadores de saúde</h2>
        <div className="bars">
          {[52, 68, 81, 61, 74].map((value, index) => (
            <div key={value + index} className="bar-group">
              <span>{['Jan', 'Fev', 'Mar', 'Abr', 'Mai'][index]}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
