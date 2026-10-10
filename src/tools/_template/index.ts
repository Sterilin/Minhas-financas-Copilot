import { lazy } from 'react'
import { Sparkles } from 'lucide-react'
import type { ToolManifest } from '../../app/toolTypes'

export const tool: ToolManifest = {
  id: 'template',
  label: 'Template',
  icon: Sparkles,
  order: 999,
  enabled: false, // Disabled by default, copy this folder to create a new tool!
  component: lazy(() => import('./TemplatePage')),
}
