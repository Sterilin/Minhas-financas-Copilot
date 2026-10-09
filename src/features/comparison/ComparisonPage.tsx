import { PageShell } from '../../components/PageShell'
import { demoComparison } from '../../data/demoData'
import { formatCurrency } from '../../domain/finance'

export function ComparisonPage() {
  return (
    <PageShell
      title="Comparativo"
      description="Comparação de desempenho por categoria entre dois períodos demonstrativos, com filtros e variação percentual preservados como referência visual."
    >
      <div className="comparison-grid">
        <article className="panel comparison-box">
          <h2>Período A</h2>
          <strong>{formatCurrency(11680)}</strong>
          <small>gastos recorrentes</small>
        </article>
        <article className="panel comparison-box">
          <h2>Período B</h2>
          <strong>{formatCurrency(12070)}</strong>
          <small>gastos recorrentes</small>
        </article>
      </div>

      <section className="panel">
        <h2>Análise por categoria</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Período A</th>
                <th>Período B</th>
                <th>Variação</th>
              </tr>
            </thead>
            <tbody>
              {demoComparison.map((item) => (
                <tr key={item.category}>
                  <td>{item.category}</td>
                  <td>{formatCurrency(item.periodA)}</td>
                  <td>{formatCurrency(item.periodB)}</td>
                  <td className={item.variation >= 0 ? 'positive' : 'negative'}>{item.variation}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  )
}
