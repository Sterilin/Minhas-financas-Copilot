import type { ToolManifest } from './toolTypes'

// Auto-discover all tool manifests in src/tools/*/index.ts
const modules = import.meta.glob<{ tool: ToolManifest }>('../tools/*/index.ts', {
  eager: true,
})

export const tools: ToolManifest[] = Object.entries(modules)
  .filter(([path]) => !path.includes('_template')) // Ignore tool template
  .map(([, mod]) => mod.tool)
  .filter((t) => t && t.enabled !== false)
  .sort((a, b) => a.order - b.order)

export function getToolById(id: string): ToolManifest | undefined {
  return tools.find((t) => t.id === id)
}
