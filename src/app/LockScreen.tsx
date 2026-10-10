import React, { useState } from 'react'
import { Eye, EyeOff, KeyRound, Lock, Unlock } from 'lucide-react'
import { useFinanceBase } from '../core/data/FinanceBaseProvider'
import './LockScreen.css'

export function LockScreen() {
  const { unlock, error } = useFinanceBase()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setLoading(true)
    await unlock(password)
    setLoading(false)
  }

  return (
    <div className="lock-screen-container">
      <div className="lock-card">
        <div className="lock-icon-wrap">
          <Lock size={32} className="lock-icon" />
        </div>
        <h2 className="lock-title">Cofre Financeiro Bloqueado</h2>
        <p className="lock-desc">
          Seus dados estão protegidos por criptografia de ponta a ponta (AES-256-GCM). Digite sua
          senha mestra para descriptografar.
        </p>

        <form onSubmit={handleSubmit} className="lock-form">
          <div className="password-input-wrap">
            <KeyRound size={18} className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha mestra..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="password-input"
            />
            <button
              type="button"
              className="btn-toggle-eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <div className="lock-error">{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-unlock">
            {loading ? (
              'Descriptografando...'
            ) : (
              <>
                <Unlock size={18} /> Acessar Minhas Finanças
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
