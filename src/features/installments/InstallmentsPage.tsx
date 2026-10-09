import { PageShell } from '../../components/PageShell'
import { demoInstallments } from '../../data/demoData'
import { formatCurrency } from '../../domain/finance'

export function InstallmentsPage() {
  const totalRemaining = demoInstallments.reduce((sum, installment) => sum + (installment.total - installment.paid), 0)

  return (
    <PageShell
      title="Parcelas"
      description="Controle de compras parceladas, valores pendentes, vencimentos e compromissos mensais demonstrativos."
    >
      <div className="metrics-grid">
        <article className="metric-card">
          <span className="metric-label">Total restante</span>
          <strong className="metric-value">{formatCurrency(totalRemaining)}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Próximo vencimento</span>
          <strong className="metric-value">10/12</strong>
        </article>
      </div>

      <section className="panel">
        <h2>Compromissos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Compra</th>
                <th>Pago</th>
                <th>Restante</th>
                <th>Vencimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {demoInstallments.map((installment) => (
                <tr key={installment.id}>
                  <td>{installment.title}</td>
                  <td>{formatCurrency(installment.paid)}</td>
                  <td>{formatCurrency(installment.total - installment.paid)}</td>
                  <td>{installment.dueDate}</td>
                  <td>{installment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  )
}
