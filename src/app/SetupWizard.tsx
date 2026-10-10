import React, { useState } from 'react'
import { ShieldCheck, Sparkles } from 'lucide-react'
import { useFinanceBase } from '../core/data/FinanceBaseProvider'
import './SetupWizard.css'

export function SetupWizard() {
  const { setup, error } = useFinanceBase()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [importHistory, setImportHistory] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (password.length < 6) {
      setValidationError('A senha mestra deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    await setup(password, importHistory)
    setLoading(false)
  }

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <div className="setup-badge">
            <Sparkles size={16} /> Configuração Inicial
          </div>
          <h2 className="setup-title">Bem-vindo ao Minhas Finanças</h2>
          <p className="setup-desc">
            Seu cockpit financeiro modular e privado. Defina sua senha mestra para criar seu cofre
            criptografado no navegador.
          </p>
        </div>

        <form onSubmit={handleCreate} className="setup-form">
          <label className="form-label">
            Senha Mestra:
            <input
              type="password"
              required
              placeholder="Digite uma senha forte..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="form-label">
            Confirmar Senha Mestra:
            <input
              type="password"
              required
              placeholder="Digite a mesma senha..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={importHistory}
              onChange={(e) => setImportHistory(e.target.checked)}
            />
            <div className="checkbox-text">
              <strong>Importar histórico 2024–2026</strong>
              <span>
                Inicializa sua base com o histórico consolidado de contas (Bradesco, Santander Conta
                e Cartão).
              </span>
            </div>
          </label>

          {(validationError || error) && (
            <div className="setup-error">{validationError || error}</div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary btn-setup">
            {loading ? (
              'Criando Cofre Criptografado...'
            ) : (
              <>
                <ShieldCheck size={18} /> Inicializar Minhas Finanças
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
