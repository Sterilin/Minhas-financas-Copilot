import { useMemo } from 'react'
import { Calendar, CreditCard, DollarSign } from 'lucide-react'
import { useFinanceBase } from '../../core/data/FinanceBaseProvider'
import { deriveActiveInstallments } from '../../core/domain/installments'
import { MetricCard } from '../../ui/MetricCard'
import { Money } from '../../ui/Money'
import { PageShell } from '../../ui/PageShell'
import { Panel } from '../../ui/Panel'
import { ProgressBar } from '../../ui/ProgressBar'
import './ParcelasPage.css'

export default function ParcelasPage() {
  const { base } = useFinanceBase()

  const installments = useMemo(() => {
    if (!base) return []
    return deriveActiveInstallments(base.transactions)
  }, [base])

  const totals = useMemo(() => {
    let remainingCents = 0
    let monthlyCommitmentCents = 0

    for (const inst of installments) {
      remainingCents += inst.remainingAmountCents
      monthlyCommitmentCents += inst.installmentAmountCents
    }

    return {
      remainingCents,
      monthlyCommitmentCents,
      count: installments.length,
    }
  }, [installments])

  if (!base) {
    return (
      <PageShell title="Parcelas">
        <p>Carregando dados financeiros...</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Compras Parceladas"
      description="Acompanhamento automático de todas as compras parceladas no cartão de crédito e previsão de quitação."
    >
      <div className="metrics-grid">
        <MetricCard
          label="Total Restante a Pagar"
          value={<Money cents={totals.remainingCents} />}
          detail="Soma de todas as parcelas futuras"
          icon={<CreditCard size={20} />}
          variant="negative"
        />
        <MetricCard
          label="Compromisso Mensal Atual"
          value={<Money cents={totals.monthlyCommitmentCents} />}
          detail="Valor debitado mensalmente na fatura"
          icon={<DollarSign size={20} />}
          variant="accent"
        />
        <MetricCard
          label="Compras Parceladas Ativas"
          value={`${totals.count} planos`}
          detail="Detectadas nos extratos de cartão"
          icon={<Calendar size={20} />}
        />
      </div>

      <Panel
        title="Detalhamento das Parcelas em Andamento"
        subtitle="Identificadas automaticamente nos extratos e faturas"
      >
        {installments.length === 0 ? (
          <p className="empty-installments">
            Nenhuma compra parcelada ativa detectada nos extratos importados.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="installments-table">
              <thead>
                <tr>
                  <th>Compra / Estabelecimento</th>
                  <th className="align-center">Progresso</th>
                  <th className="align-right">Valor da Parcela</th>
                  <th className="align-right">Total Pago</th>
                  <th className="align-right">Total Restante</th>
                  <th className="align-center">Previsão de Término</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst) => {
                  const progressPct = (inst.currentInstallment / inst.totalInstallments) * 100
                  return (
                    <tr key={inst.id}>
                      <td>
                        <strong className="inst-title">{inst.title}</strong>
                        <div className="inst-sub">
                          Último registro em {inst.lastDate}
                        </div>
                      </td>
                      <td className="align-center progress-col">
                        <div className="inst-progress-wrap">
                          <span className="inst-badge badge badge-accent">
                            {inst.currentInstallment} de {inst.totalInstallments}
                          </span>
                          <ProgressBar percent={progressPct} color="accent" />
                        </div>
                      </td>
                      <td className="align-right font-semibold">
                        <Money cents={inst.installmentAmountCents} />
                      </td>
                      <td className="align-right">
                        <Money cents={inst.paidAmountCents} />
                      </td>
                      <td className="align-right font-semibold text-negative">
                        <Money cents={inst.remainingAmountCents} />
                      </td>
                      <td className="align-center">
                        <span className="badge">
                          {inst.projectedEndDate}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </PageShell>
  )
}
