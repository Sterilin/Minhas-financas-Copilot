import React, { useMemo, useState } from 'react'
import { Plus, ShieldCheck, Target, Trash2 } from 'lucide-react'
import { useFinanceBase } from '../../core/data/FinanceBaseProvider'
import { calculateAccountBalances } from '../../core/domain/balances'
import { formatCents, numberToCents } from '../../core/domain/money'
import type { Goal } from '../../core/types/base'
import { MetricCard } from '../../ui/MetricCard'
import { Money } from '../../ui/Money'
import { PageShell } from '../../ui/PageShell'
import { ProgressBar } from '../../ui/ProgressBar'
import './MetasPage.css'

export default function MetasPage() {
  const { base, saveBase } = useFinanceBase()
  const [showAddModal, setShowAddModal] = useState(false)

  // New goal form state
  const [newTitle, setNewTitle] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newSaved, setNewSaved] = useState('')
  const [newMonthly, setNewMonthly] = useState('')
  const [newDue, setNewDue] = useState('')

  const accountBalances = useMemo(() => {
    if (!base) return []
    return calculateAccountBalances(base)
  }, [base])

  const totalLiquidCents = useMemo(() => {
    return accountBalances
      .filter((a) => a.account.type === 'checking' || a.account.type === 'savings')
      .reduce((sum, a) => sum + a.balanceCents, 0)
  }, [accountBalances])

  const totalReservedGoalsCents = useMemo(() => {
    if (!base) return 0
    return base.goals.reduce((sum, g) => sum + g.savedCents, 0)
  }, [base])

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newTarget) return

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: newTitle,
      targetCents: numberToCents(parseFloat(newTarget)),
      savedCents: newSaved ? numberToCents(parseFloat(newSaved)) : 0,
      monthlyContributionCents: newMonthly ? numberToCents(parseFloat(newMonthly)) : 0,
      dueDate: newDue || '2027-12-31',
      category: 'Geral',
    }

    await saveBase((prev) => ({
      ...prev,
      goals: [...prev.goals, goal],
    }))

    setNewTitle('')
    setNewTarget('')
    setNewSaved('')
    setNewMonthly('')
    setNewDue('')
    setShowAddModal(false)
  }

  const handleDeleteGoal = async (id: string) => {
    await saveBase((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }))
  }

  if (!base) {
    return (
      <PageShell title="Metas">
        <p>Carregando dados financeiros...</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Metas e Objetivos"
      description="Gerencie objetivos de poupança, reservas acumuladas e acompanhe o percentual concluído."
      actions={
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} /> Nova Meta
        </button>
      }
    >
      <div className="metrics-grid">
        <MetricCard
          label="Total Acumulado em Metas"
          value={<Money cents={totalReservedGoalsCents} />}
          detail="Valor planejado reservado"
          icon={<Target size={20} />}
          variant="accent"
        />
        <MetricCard
          label="Saldo Líquido Disponível"
          value={<Money cents={totalLiquidCents} />}
          detail="Disponível em contas correntes"
          icon={<ShieldCheck size={20} />}
          variant="positive"
        />
      </div>

      {/* Goal Cards Grid */}
      <div className="goals-grid">
        {base.goals.map((goal) => {
          const pct = Math.min(100, (goal.savedCents / goal.targetCents) * 100)
          return (
            <article key={goal.id} className="goal-card panel">
              <div className="goal-card-header">
                <div>
                  <span className="badge badge-accent">{goal.category}</span>
                  <h3 className="goal-title">{goal.title}</h3>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  title="Excluir meta"
                  onClick={() => handleDeleteGoal(goal.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="goal-values">
                <div>
                  <span className="goal-label">Acumulado</span>
                  <strong className="goal-val text-positive">
                    <Money cents={goal.savedCents} />
                  </strong>
                </div>
                <div className="align-right">
                  <span className="goal-label">Alvo</span>
                  <strong className="goal-val">
                    <Money cents={goal.targetCents} />
                  </strong>
                </div>
              </div>

              <div className="goal-progress-wrap">
                <ProgressBar percent={pct} color="positive" />
                <div className="goal-progress-meta">
                  <span>{Math.round(pct)}% concluído</span>
                  {goal.monthlyContributionCents > 0 && (
                    <span>
                      {formatCents(goal.monthlyContributionCents)} / mês
                    </span>
                  )}
                </div>
              </div>

              {goal.dueDate && (
                <div className="goal-due-meta">
                  Prazo estimado: {goal.dueDate}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Nova Meta Financeira</h3>
            <form onSubmit={handleCreateGoal} className="modal-form">
              <label className="form-label">
                Título do Objetivo:
                <input
                  type="text"
                  required
                  placeholder="Ex: Viagem, Fundo de emergência..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="form-input"
                />
              </label>

              <div className="form-row">
                <label className="form-label">
                  Valor Alvo (R$):
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 15000"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    className="form-input"
                  />
                </label>
                <label className="form-label">
                  Já Poupado (R$):
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5000"
                    value={newSaved}
                    onChange={(e) => setNewSaved(e.target.value)}
                    className="form-input"
                  />
                </label>
              </div>

              <div className="form-row">
                <label className="form-label">
                  Aporte Mensal (R$):
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1000"
                    value={newMonthly}
                    onChange={(e) => setNewMonthly(e.target.value)}
                    className="form-input"
                  />
                </label>
                <label className="form-label">
                  Prazo Desejado:
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="form-input"
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  )
}
