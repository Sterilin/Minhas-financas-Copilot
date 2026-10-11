import React, { useState } from 'react'
import {
  Download,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useFinanceBase } from '../../core/data/FinanceBaseProvider'
import { applyRulesToTransactions } from '../../core/domain/rules'
import type { Account, CategoryRule } from '../../core/types/base'
import { getGitHubToken, saveGitHubToken } from '../../core/vault/storage'
import { PageShell } from '../../ui/PageShell'
import { Panel } from '../../ui/Panel'
import './ConfiguracoesPage.css'

export default function ConfiguracoesPage() {
  const { base, saveBase, lock, exportBackup } = useFinanceBase()

  // New account form state
  const [accName, setAccName] = useState('')
  const [accInstitution, setAccInstitution] = useState('bradesco')
  const [accType, setAccType] = useState<Account['type']>('checking')
  const [accId, setAccId] = useState('')

  // New rule form state
  const [rulePattern, setRulePattern] = useState('')
  const [ruleCatId, setRuleCatId] = useState('')
  const [ruleKind, setRuleKind] = useState<'income' | 'expense' | 'transfer' | 'card_payment'>('expense')

  // GitHub sync state
  const [ghToken, setGhToken] = useState(() => getGitHubToken() || '')
  const [ghRepo, setGhRepo] = useState(() => base?.settings.githubRepo || 'Sterilin/Minhas-financas-Copilot')
  const [savedNotice, setSavedNotice] = useState(false)

  // Fiscal start day
  const [fiscalStartDay, setFiscalStartDay] = useState(() => base?.settings.fiscalStartDay || 16)

  // Rules re-apply feedback
  const [reclassifiedNotice, setReclassifiedNotice] = useState<string | null>(null)

  if (!base) {
    return (
      <PageShell title="Configurações">
        <p>Carregando dados financeiros...</p>
      </PageShell>
    )
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accName || !accId) return

    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      name: accName,
      institution: accInstitution,
      type: accType,
      identifier: accId,
    }

    await saveBase((prev) => ({
      ...prev,
      accounts: [...prev.accounts, newAcc],
    }))

    setAccName('')
    setAccId('')
  }

  const handleDeleteAccount = async (id: string) => {
    await saveBase((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }))
  }

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rulePattern) return

    const newRule: CategoryRule = {
      id: `rule-${Date.now()}`,
      pattern: rulePattern,
      type: 'contains',
      categoryId: ruleCatId || undefined,
      kind: ruleKind,
      priority: 60,
    }

    await saveBase((prev) => {
      const updatedRules = [newRule, ...prev.rules]
      return {
        ...prev,
        rules: updatedRules,
        transactions: applyRulesToTransactions(prev.transactions, updatedRules),
      }
    })

    setRulePattern('')
    setReclassifiedNotice('Regra adicionada e transações reclassificadas!')
    setTimeout(() => setReclassifiedNotice(null), 3000)
  }

  const handleDeleteRule = async (id: string) => {
    await saveBase((prev) => {
      const updatedRules = prev.rules.filter((r) => r.id !== id)
      return {
        ...prev,
        rules: updatedRules,
        transactions: applyRulesToTransactions(prev.transactions, updatedRules),
      }
    })
    setReclassifiedNotice('Regra removida e transações atualizadas!')
    setTimeout(() => setReclassifiedNotice(null), 3000)
  }

  const handleReapplyRules = async () => {
    if (!base) return
    await saveBase((prev) => ({
      ...prev,
      transactions: applyRulesToTransactions(prev.transactions, prev.rules),
    }))
    setReclassifiedNotice(`${base.transactions.length} lançamentos reclassificados com sucesso!`)
    setTimeout(() => setReclassifiedNotice(null), 3500)
  }

  const handleSaveSettings = async () => {
    saveGitHubToken(ghToken)
    await saveBase((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        fiscalStartDay: Number(fiscalStartDay),
        githubRepo: ghRepo,
      },
    }))
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }

  return (
    <PageShell
      title="Configurações & Cofre"
      description="Gerencie contas bancárias cadastradas, regras de categorização automática, sincronização em nuvem e segurança."
    >
      {/* Accounts Management */}
      <Panel
        title="Contas Bancárias e Cartões"
        subtitle="Gerencie as fontes de dados para classificação e conciliação"
      >
        <div className="accounts-list">
          {base.accounts.map((acc) => (
            <div key={acc.id} className="acc-item">
              <div className="acc-details">
                <Wallet size={18} className="acc-icon" />
                <div>
                  <strong>{acc.name}</strong>
                  <span className="acc-meta">
                    {acc.institution.toUpperCase()} • Final {acc.identifier} •{' '}
                    {acc.type === 'credit_card' ? 'Cartão de Crédito' : 'Conta Corrente'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                title="Excluir conta"
                onClick={() => handleDeleteAccount(acc.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddAccount} className="add-acc-form">
          <h4 className="form-heading">Adicionar Nova Conta</h4>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Nome (Ex: Itaú Corrente)"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              required
              className="form-input"
            />
            <input
              type="text"
              placeholder="Final/Identificador (Ex: 1234-5)"
              value={accId}
              onChange={(e) => setAccId(e.target.value)}
              required
              className="form-input"
            />
            <select
              value={accType}
              onChange={(e) => setAccType(e.target.value as Account['type'])}
              className="form-input"
            >
              <option value="checking">Conta Corrente</option>
              <option value="credit_card">Cartão de Crédito</option>
              <option value="savings">Poupança</option>
              <option value="investment">Investimento</option>
            </select>
            <select
              value={accInstitution}
              onChange={(e) => setAccInstitution(e.target.value)}
              className="form-input"
            >
              <option value="bradesco">Bradesco</option>
              <option value="santander">Santander</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            <Plus size={14} /> Adicionar Conta
          </button>
        </form>
      </Panel>

      {/* Rules Engine */}
      <Panel
        title="Regras de Classificação e Transferência"
        subtitle="Mapeie palavras-chave na descrição para categorias ou transferências internas"
        action={
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleReapplyRules}
            title="Reclassifica todos os lançamentos com base nas regras atuais"
          >
            <RefreshCw size={14} /> Reaplicar Regras
          </button>
        }
      >
        {reclassifiedNotice && (
          <div
            style={{
              padding: '8px 12px',
              marginBottom: 16,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(78, 110, 74, 0.15)',
              color: 'var(--positive)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {reclassifiedNotice}
          </div>
        )}
        <div className="rules-list">
          {base.rules.map((rule) => {
            const catName = base.categories.find((c) => c.id === rule.categoryId)?.name
            return (
              <div key={rule.id} className="rule-item">
                <div>
                  <span className="rule-pattern">Contém "{rule.pattern}"</span>
                  <span className="rule-badge badge badge-accent">
                    {rule.kind === 'transfer'
                      ? 'Transferência Interna'
                      : rule.kind === 'card_payment'
                      ? 'Pagto Cartão'
                      : catName || 'Classificar'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-icon"
                  title="Excluir regra"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>

        <form onSubmit={handleAddRule} className="add-rule-form">
          <h4 className="form-heading">Criar Nova Regra</h4>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Texto na descrição (Ex: uber, spotify)"
              value={rulePattern}
              onChange={(e) => setRulePattern(e.target.value)}
              required
              className="form-input"
            />
            <select
              value={ruleKind}
              onChange={(e) => setRuleKind(e.target.value as typeof ruleKind)}
              className="form-input"
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
              <option value="transfer">Transferência Interna</option>
              <option value="card_payment">Pagamento de Cartão</option>
            </select>
            <select
              value={ruleCatId}
              onChange={(e) => setRuleCatId(e.target.value)}
              className="form-input"
            >
              <option value="">Sem categoria específica</option>
              {base.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            <Plus size={14} /> Adicionar Regra
          </button>
        </form>
      </Panel>

      {/* Settings & GitHub Sync */}
      <Panel
        title="Parâmetros do Sistema e Sincronização"
        subtitle="Configure o ciclo fiscal e sincronização segura com o repositório GitHub"
      >
        <div className="settings-fields">
          <label className="form-label">
            Dia de Início do Ciclo Fiscal:
            <input
              type="number"
              min="1"
              max="28"
              value={fiscalStartDay}
              onChange={(e) => setFiscalStartDay(Number(e.target.value))}
              className="form-input form-input-sm"
            />
            <small className="form-hint">
              Padrão: dia 16 (o mês fiscal vai do dia 16 do mês anterior ao dia 15).
            </small>
          </label>

          <label className="form-label">
            Repositório GitHub (user/repo):
            <input
              type="text"
              value={ghRepo}
              onChange={(e) => setGhRepo(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            Token de Acesso GitHub (Fine-grained com permissão Contents: Write no branch data):
            <input
              type="password"
              placeholder="ghp_..."
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              className="form-input"
            />
            <small className="form-hint">
              Permite sincronizar o cofre criptografado entre o computador e seu celular.
            </small>
          </label>

          <button type="button" className="btn btn-primary" onClick={handleSaveSettings}>
            Salvar Parâmetros
          </button>
          {savedNotice && <span className="text-positive font-semibold">Parâmetros salvos!</span>}
        </div>
      </Panel>

      {/* Backup and Lock */}
      <Panel title="Backup & Segurança" subtitle="Mantenha cópias offline dos seus dados">
        <div className="security-actions">
          <button type="button" className="btn btn-secondary" onClick={exportBackup}>
            <Download size={16} /> Exportar Backup Descriptografado (.json)
          </button>
          <button type="button" className="btn btn-secondary text-negative" onClick={lock}>
            <Lock size={16} /> Bloquear Cofre Agora
          </button>
        </div>
      </Panel>
    </PageShell>
  )
}
