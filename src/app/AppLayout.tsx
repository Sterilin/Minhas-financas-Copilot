import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Lock,
  Moon,
  Sun,
  Wallet,
} from 'lucide-react'
import { useFinanceBase } from '../core/data/FinanceBaseProvider'
import { tools } from './registry'
import './AppLayout.css'

export function AppLayout() {
  const { lock } = useFinanceBase()
  const location = useLocation()

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    return (
      localStorage.getItem('minhas_financas_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    )
  })

  // Privacy state
  const [isPrivacy, setIsPrivacy] = useState(() => {
    return localStorage.getItem('minhas_financas_privacy') === 'true'
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('minhas_financas_theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('minhas_financas_theme', 'light')
    }
  }, [isDark])

  useEffect(() => {
    if (isPrivacy) {
      document.body.classList.add('privacy-active')
      localStorage.setItem('minhas_financas_privacy', 'true')
    } else {
      document.body.classList.remove('privacy-active')
      localStorage.setItem('minhas_financas_privacy', 'false')
    }
  }, [isPrivacy])

  const currentPath = location.pathname.replace(/^\//, '') || tools[0]?.id || 'resumo'

  return (
    <div className="app-shell-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-wrap">
            <Wallet size={20} className="brand-icon" />
          </div>
          <div>
            <span className="brand-eyebrow">Minhas Finanças</span>
            <strong className="brand-title">FinançasPro</strong>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação Principal">
          {tools.map((tool) => {
            const Icon = tool.icon
            const isActive = currentPath === tool.id
            return (
              <Link
                key={tool.id}
                to={`/${tool.id}`}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                <Icon size={18} className="nav-icon" />
                <span className="nav-label">{tool.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="footer-btn"
            title={isPrivacy ? 'Desativar modo privacidade' : 'Ativar modo privacidade'}
            onClick={() => setIsPrivacy(!isPrivacy)}
          >
            {isPrivacy ? <EyeOff size={18} /> : <Eye size={18} />}
            <span>Privacidade</span>
          </button>

          <button
            type="button"
            className="footer-btn"
            title={isDark ? 'Tema Claro' : 'Tema Escuro'}
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{isDark ? 'Claro' : 'Escuro'}</span>
          </button>

          <button
            type="button"
            className="footer-btn footer-btn-lock"
            title="Bloquear cofre"
            onClick={lock}
          >
            <Lock size={18} />
            <span>Bloquear</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-viewport">
        {/* Mobile Top Header */}
        <header className="mobile-header">
          <div className="mobile-brand">
            <Wallet size={20} className="brand-icon" />
            <strong>Minhas Finanças</strong>
          </div>
          <div className="mobile-controls">
            <button
              type="button"
              className="btn-icon"
              onClick={() => setIsPrivacy(!isPrivacy)}
            >
              {isPrivacy ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setIsDark(!isDark)}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={lock}
            >
              <Lock size={18} />
            </button>
          </div>
        </header>

        {/* Dynamic Tool Route View */}
        <div className="tool-view-container">
          <Suspense
            fallback={
              <div className="tool-loading">
                <p>Carregando ferramenta...</p>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="bottom-bar" aria-label="Navegação Celular">
          {tools.map((tool) => {
            const Icon = tool.icon
            const isActive = currentPath === tool.id
            return (
              <Link
                key={tool.id}
                to={`/${tool.id}`}
                className={`bottom-tab ${isActive ? 'bottom-tab-active' : ''}`}
              >
                <Icon size={20} />
                <span className="bottom-tab-label">{tool.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
