import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  FinanceBaseProvider,
  useFinanceBase,
} from '../core/data/FinanceBaseProvider'
import { AppLayout } from './AppLayout'
import { LockScreen } from './LockScreen'
import { tools } from './registry'
import { SetupWizard } from './SetupWizard'
import '../ui/base.css'

function AppContent() {
  const { status } = useFinanceBase()

  if (status === 'loading') {
    return (
      <div className="app-loading-screen">
        <p>Iniciando Minhas Finanças...</p>
      </div>
    )
  }

  if (status === 'setup') {
    return <SetupWizard />
  }

  if (status === 'locked') {
    return <LockScreen />
  }

  const defaultToolId = tools[0]?.id || 'resumo'

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to={`/${defaultToolId}`} replace />} />
          {tools.map((tool) => {
            const Component = tool.component
            return <Route key={tool.id} path={tool.id} element={<Component />} />
          })}
          <Route path="*" element={<Navigate to={`/${defaultToolId}`} replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default function App() {
  return (
    <FinanceBaseProvider>
      <AppContent />
    </FinanceBaseProvider>
  )
}
