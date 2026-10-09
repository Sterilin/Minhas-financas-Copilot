import type { PageKey } from '../types'

interface NavigationProps {
  activePage: PageKey
  onChange: (page: PageKey) => void
}

const navItems: Array<{ key: PageKey; label: string }> = [
  { key: 'summary', label: 'Resumo' },
  { key: 'comparison', label: 'Comparativo' },
  { key: 'installments', label: 'Parcelas' },
  { key: 'goals', label: 'Metas' },
  { key: 'data', label: 'Dados' },
]

export function Navigation({ activePage, onChange }: NavigationProps) {
  return (
    <nav className="main-navigation" aria-label="Navegação principal">
      {navItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={activePage === item.key ? 'nav-tab active' : 'nav-tab'}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
