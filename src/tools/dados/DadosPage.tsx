import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useFinanceBase } from '../../core/data/FinanceBaseProvider'
import { Amount } from '../../ui/Amount'
import { Money } from '../../ui/Money'
import { PageShell } from '../../ui/PageShell'
import { Panel } from '../../ui/Panel'
import './DadosPage.css'

export default function DadosPage() {
  const { base } = useFinanceBase()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('all')
  const [selectedKind, setSelectedKind] = useState('all')

  const filteredTransactions = useMemo(() => {
    if (!base) return []

    return base.transactions.filter((t) => {
      // Account filter
      if (selectedAccountId !== 'all' && t.accountId !== selectedAccountId) {
        return false
      }

      // Kind filter
      if (selectedKind !== 'all' && t.kind !== selectedKind) {
        return false
      }

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchesDesc = t.description.toLowerCase().includes(term)
        const matchesRaw = t.rawDescription.toLowerCase().includes(term)
        return matchesDesc || matchesRaw
      }

      return true
    })
  }, [base, selectedAccountId, selectedKind, searchTerm])

  const accountMap = useMemo(() => {
    if (!base) return new Map()
    return new Map(base.accounts.map((a) => [a.id, a.name]))
  }, [base])

  const categoryMap = useMemo(() => {
    if (!base) return new Map()
    return new Map(base.categories.map((c) => [c.id, c.name]))
  }, [base])

  if (!base) {
    return (
      <PageShell title="Dados">
        <p>Carregando dados financeiros...</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Base de Transações"
      description="Consulte e audite todas as transações importadas de contas e cartões com filtros inteligentes."
    >
      {/* Filters Toolbar */}
      <div className="dados-toolbar panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Pesquisar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-group">
          <div className="filter-item">
            <label htmlFor="filter-acc" className="filter-label">
              Conta:
            </label>
            <select
              id="filter-acc"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas as Contas</option>
              {base.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-kind" className="filter-label">
              Tipo:
            </label>
            <select
              id="filter-kind"
              value={selectedKind}
              onChange={(e) => setSelectedKind(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos os Tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
              <option value="transfer">Transferências Internas</option>
              <option value="card_payment">Pagamentos de Fatura</option>
              <option value="investment">Investimentos / Aplicações</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <Panel
        title={`Histórico de Lançamentos (${filteredTransactions.length} registros)`}
        subtitle="Exibindo dados reais sincronizados na base unificada"
      >
        <div className="table-wrapper">
          <table className="dados-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Conta</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th className="align-right">Valor</th>
                <th className="align-right">Saldo Após</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 150).map((t) => (
                <tr key={t.id}>
                  <td className="font-mono">{t.date}</td>
                  <td>
                    <span className="badge">
                      {accountMap.get(t.accountId) || 'Geral'}
                    </span>
                  </td>
                  <td>
                    <strong className="tx-desc">{t.description}</strong>
                    {t.installment && (
                      <span className="badge badge-accent badge-sm">
                        {t.installment.current}/{t.installment.total}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="cat-pill">
                      {categoryMap.get(t.categoryId) || 'Outros'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        t.kind === 'transfer'
                          ? 'badge-accent'
                          : t.kind === 'income'
                          ? 'badge-positive'
                          : 'badge-default'
                      }`}
                    >
                      {t.kind === 'transfer'
                        ? 'Transferência'
                        : t.kind === 'card_payment'
                        ? 'Pagto Cartão'
                        : t.kind === 'investment'
                        ? 'Investimento'
                        : t.kind === 'income'
                        ? 'Receita'
                        : 'Despesa'}
                    </span>
                  </td>
                  <td className="align-right">
                    <Amount cents={t.amountCents} />
                  </td>
                  <td className="align-right font-mono text-muted">
                    {t.balanceAfterCents !== undefined ? (
                      <Money cents={t.balanceAfterCents} />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length > 150 && (
          <p className="pagination-note">
            Mostrando os primeiros 150 de {filteredTransactions.length} lançamentos.
          </p>
        )}
      </Panel>
    </PageShell>
  )
}
