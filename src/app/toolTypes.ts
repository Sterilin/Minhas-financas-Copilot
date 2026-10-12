import type { ComponentType, LazyExoticComponent } from 'react'

export interface ToolManifest {
  id: string // URL route: e.g. 'resumo', 'comparativo', 'parcelas'
  label: string // Menu label: e.g. 'Resumo'
  description?: string
  icon: ComponentType<{ size?: number | string; className?: string }>
  order: number // Tab display order
  enabled?: boolean
  component: LazyExoticComponent<ComponentType>
}
