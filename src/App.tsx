import { useState, type ReactElement } from 'react'
import { Navigation } from './components/Navigation'
import { ComparisonPage } from './features/comparison/ComparisonPage'
import { DataPage } from './features/data/DataPage'
import { GoalsPage } from './features/goals/GoalsPage'
import { InstallmentsPage } from './features/installments/InstallmentsPage'
import { SummaryPage } from './features/summary/SummaryPage'
import './App.css'
import type { PageKey } from './types'

const pageMap: Record<PageKey, ReactElement> = {
  summary: <SummaryPage />,
  comparison: <ComparisonPage />,
  installments: <InstallmentsPage />,
  goals: <GoalsPage />,
  data: <DataPage />,
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>('summary')

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Minhas Finanças</p>
          <h1>Dashboard de demonstração</h1>
        </div>
        <div className="status-pill">modo demonstração</div>
      </header>

      <Navigation activePage={activePage} onChange={setActivePage} />
      {pageMap[activePage]}
    </div>
  )
}

export default App
