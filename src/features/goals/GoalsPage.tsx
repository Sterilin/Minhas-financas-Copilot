import { PageShell } from '../../components/PageShell'
import { demoGoals } from '../../data/demoData'
import { calculateProgress, formatCurrency } from '../../domain/finance'

export function GoalsPage() {
  return (
    <PageShell
      title="Metas"
      description="Criação e acompanhamento de metas com aportes, progresso e imagens de demonstração apenas para protótipo inicial."
    >
      <div className="goal-grid">
        {demoGoals.map((goal) => (
          <article key={goal.id} className="goal-card panel">
            <div className="goal-header">
              <div>
                <span className="tag">{goal.category}</span>
                <h2>{goal.title}</h2>
              </div>
              <span className="image-pill">{goal.imageLabel}</span>
            </div>
            <div className="goal-values">
              <span>{formatCurrency(goal.saved)}</span>
              <span>{formatCurrency(goal.target)}</span>
            </div>
            <div className="progress-bar" aria-label={`Progresso de ${goal.title}`}>
              <div className="progress-fill" style={{ width: `${calculateProgress(goal)}%` }} />
            </div>
            <div className="goal-meta">
              <small>{Math.round(calculateProgress(goal))}% concluído</small>
              <small>{goal.monthlyContribution}/mês</small>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  )
}
