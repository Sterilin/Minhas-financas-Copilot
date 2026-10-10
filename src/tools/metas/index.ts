import { lazy } from 'react'
import { Target } from 'lucide-react'
import type { ToolManifest } from '../../app/toolTypes'

export const tool: ToolManifest = {
  id: 'metas',
  label: 'Metas',
  description: 'Planejamento de objetivos, aportes mensais e cobertura de emergência.',
  icon: Target,
  order: 40,
  component: lazy(() => import('./MetasPage')),
}
