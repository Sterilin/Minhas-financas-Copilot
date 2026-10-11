import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useFinanceBase } from '../../core/data/FinanceBaseProvider'
import { sortTransactionsDesc } from '../../core/domain/rules'
import { Amount } from '../../ui/Amount'
import { Money } from '../../ui/Money'
import { PageShell } from '../../ui/PageShell'
import { Panel } from '../../ui/Panel'
import './DadosPage.css'

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const idx = parseInt(month, 10) - 1
  return `${MONTH_NAMES[idx] || month} ${year}`
}

export default function DadosPage() {
  const { base } = useFinanceBase()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('all')
  const [selectedKind, setSelectedKind] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(100)

  // Extract unique sorted months in descending order (e.g. 2026-09, 2026-08, ...)
  const availableMonths = useMemo(() => {
    if (!base) return []
    const months = new Set<string>()
    for (const t of base.transactions) {
      if (t.date && t.date.length >= 7) {
        months.add(t.date.slice(0, 7))
      }
    }
    return Array.from(months).sort().reverse()
  }, [base])

  // Filter and sort transactions newest-first
  const filteredTransactions = useMemo(() => {
    if (!base) return []

    const sorted = sortTransactionsDesc(base.transactions)

    return sorted.filter((t) => {
      // Month filter
      if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) {
        return false
      }

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
  }, [base, selectedMonth, selectedAccountId, selectedKind, searchTerm])

  // Pagination calculation
  const totalItems = filteredTransactions.length
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(currentPage, totalPages)

  const paginatedTransactions = useMemo(() => {
    if (pageSize === -1) return filteredTransactions
    const start = (safePage - 1) * pageSize
    return filteredTransactions.slice(start, start + pageSize)
  }, [filteredTransactions, safePage, pageSize])

  const accountMap = useMemo(() => {
    if (!base) return new Map()
    return new Map(base.accounts.map((a) => [a.id, a.name]))
  }, [base])

  const categoryMap = useMemo(() => {
    if (!base) return new Map()
    return new Map(base.categories.map((c) => [c.id, c]))
  }, [base])

  // Reset page to 1 when filters change
  const handleFilterChange = (setter: (val: string) => void, val: string) => {
    setter(val)
    setCurrentPage(1)
  }

  if (!base) {
    return (
      <PageShell title="Dados">
        <p>Carregando dados financeiros...</p>
      </PageShell>
    )
  }

  const startRecord = totalItems === 0 ? 0 : pageSize === -1 ? 1 : (safePage - 1) * pageSize + 1
  const endRecord =
    pageSize === -1 ? totalItems : Math.min(safePage * pageSize, totalItems)

  return (
    <PageShell
      title="Base de Transações"
      description="Consulte e audite todas as transações importadas de contas e cartões com filtros inteligentes e categorização automática."
    >
      {/* Filters Toolbar */}
      <div className="dados-toolbar panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Pesquisar por descrição..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="search-input"
          />
        </div>

        <div className="filters-group">
          {/* Month / Period Filter */}
          <div className="filter-item">
            <label htmlFor="filter-month" className="filter-label">
              Mês:
            </label>
            <select
              id="filter-month"
              value={selectedMonth}
              onChange={(e) => handleFilterChange(setSelectedMonth, e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos os Meses</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div className="filter-item">
            <label htmlFor="filter-acc" className="filter-label">
              Conta:
            </label>
            <select
              id="filter-acc"
              value={selectedAccountId}
              onChange={(e) => handleFilterChange(setSelectedAccountId, e.target.value)}
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

          {/* Kind Filter */}
          <div className="filter-item">
            <label htmlFor="filter-kind" className="filter-label">
              Tipo:
            </label>
            <select
              id="filter-kind"
              value={selectedKind}
              onChange={(e) => handleFilterChange(setSelectedKind, e.target.value)}
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
        title={`Histórico de Lançamentos (${totalItems} registros)`}
        subtitle="Exibindo lançamentos ordenados do mais recente para o mais antigo"
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
              {paginatedTransactions.map((t) => {
                const catObj = t.categoryId ? categoryMap.get(t.categoryId) : undefined
                return (
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
                      {catObj ? (
                        <span
                          className="cat-pill"
                          style={{
                            borderColor: `${catObj.color}40`,
                            backgroundColor: `${catObj.color}18`,
                            color: 'var(--text-main)',
                          }}
                        >
                          <span
                            className="cat-dot"
                            style={{ backgroundColor: catObj.color }}
                          />
                          {catObj.name}
                        </span>
                      ) : (
                        <span className="cat-pill text-muted">
                          {t.kind === 'transfer'
                            ? 'Transferência'
                            : t.kind === 'card_payment'
                            ? 'Fatura'
                            : t.kind === 'investment'
                            ? 'Aplicação'
                            : 'Outros'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.kind === 'transfer'
                            ? 'badge-accent'
                            : t.kind === 'income'
                            ? 'badge-positive'
                            : t.kind === 'investment'
                            ? 'badge-accent'
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
                )
              })}
              {paginatedTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-notice">
                    Nenhum lançamento encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="pagination-controls">
          <div className="pagination-info">
            Mostrando <strong>{startRecord}</strong> - <strong>{endRecord}</strong> de{' '}
            <strong>{totalItems}</strong> lançamentos
          </div>

          <div className="pagination-right">
            <div className="page-size-selector">
              <label htmlFor="page-size-select" className="filter-label">
                Por página:
              </label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="filter-select select-sm"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={-1}>Todos</option>
              </select>
            </div>

            {pageSize !== -1 && totalPages > 1 && (
              <div className="pagination-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                <span className="page-indicator">
                  {safePage} de {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Próxima página"
                >
                  Próxima <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </Panel>
    </PageShell>
  )
}
