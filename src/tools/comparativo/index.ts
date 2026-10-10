import { lazy } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import type { ToolManifest } from '../../app/toolTypes'

export const tool: ToolManifest = {
  id: 'comparativo',
  label: 'Comparativo',
  description: 'Análise detalhada de gastos por categoria entre dois períodos.',
  icon: ArrowLeftRight,
  order: 20,
  component: lazy(() => import('./ComparativoPage')),
}
