import type { ReactNode } from 'react'

interface PageShellProps {
  title: string
  description: string
  children: ReactNode
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Demonstração</p>
          <h1>{title}</h1>
        </div>
        <span className="demo-badge">dados fictícios</span>
      </div>
      <p className="page-description">{description}</p>
      {children}
    </section>
  )
}
