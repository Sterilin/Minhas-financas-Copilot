import { PageShell } from '../../components/PageShell'
import { demoEntries } from '../../data/demoData'
import { formatCurrency } from '../../domain/finance'

export function DataPage() {
  return (
    <PageShell
      title="Dados"
      description="Consulta de extratos, faturas e histórico de importação em painel demonstrativo, sem vínculo com dados financeiros reais."
    >
      <div className="data-toolbar panel">
        <span>Fonte: Conta demo</span>
        <span>Período: setembro 2026</span>
        <span>Importação: demonstrativa</span>
      </div>

      <section className="panel">
        <h2>Últimos registros</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Origem</th>
                <th>Data</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {demoEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.source}</td>
                  <td>{entry.date}</td>
                  <td>{entry.description}</td>
                  <td>{formatCurrency(entry.amount)}</td>
                  <td>{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  )
}
