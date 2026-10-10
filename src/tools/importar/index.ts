import { lazy } from 'react'
import { UploadCloud } from 'lucide-react'
import type { ToolManifest } from '../../app/toolTypes'

export const tool: ToolManifest = {
  id: 'importar',
  label: 'Importar',
  description: 'Envie PDFs de extratos bancários e faturas de cartão para atualizar a base.',
  icon: UploadCloud,
  order: 60,
  component: lazy(() => import('./ImportarPage')),
}
