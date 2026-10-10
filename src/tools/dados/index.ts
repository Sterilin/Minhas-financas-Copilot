import { lazy } from 'react'
import { Database } from 'lucide-react'
import type { ToolManifest } from '../../app/toolTypes'

export const tool: ToolManifest = {
  id: 'dados',
  label: 'Dados',
  description: 'Auditoria completa, consulta de extratos e histórico de lançamentos.',
  icon: Database,
  order: 50,
  component: lazy(() => import('./DadosPage')),
}
