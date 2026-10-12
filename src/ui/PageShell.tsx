import React from 'react'
import './PageShell.css'

interface PageShellProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-header-text">
          <p className="eyebrow">Minhas Finanças</p>
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </header>
      <main className="page-content">{children}</main>
    </div>
  )
}
