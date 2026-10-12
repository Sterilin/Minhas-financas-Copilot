import { lazy } from 'react'
import { CalendarClock } from 'lucide-react'
import type { ToolManifest } from '../../app/toolTypes'

export const tool: ToolManifest = {
  id: 'parcelas',
  label: 'Parcelas',
  description: 'Controle de compras parceladas no cartão e projeção de vencimentos futuros.',
  icon: CalendarClock,
  order: 30,
  component: lazy(() => import('./ParcelasPage')),
}
