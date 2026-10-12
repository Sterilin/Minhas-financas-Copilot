import { lazy } from 'react'
import { Settings } from 'lucide-react'
import type { ToolManifest } from '../../app/toolTypes'

export const tool: ToolManifest = {
  id: 'configuracoes',
  label: 'Configurações',
  description: 'Gestão de contas, regras de categorização, sincronização e segurança.',
  icon: Settings,
  order: 70,
  component: lazy(() => import('./ConfiguracoesPage')),
}
