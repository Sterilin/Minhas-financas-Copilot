import { lazy } from 'react'
import { LayoutDashboard } from 'lucide-react'
import type { ToolManifest } from '../../app/toolTypes'

export const tool: ToolManifest = {
  id: 'resumo',
  label: 'Resumo',
  description: 'Visão consolidada de patrimônio, fluxo de caixa e compromissos.',
  icon: LayoutDashboard,
  order: 10,
  component: lazy(() => import('./ResumoPage')),
}
