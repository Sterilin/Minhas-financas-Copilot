import { describe, expect, it } from 'vitest'
import { tools } from './registry'

describe('Modular Tool Registry', () => {
  it('auto-discovers all enabled tools sorted by order', () => {
    expect(tools.length).toBeGreaterThanOrEqual(6)

    const toolIds = tools.map((t) => t.id)
    expect(toolIds).toContain('resumo')
    expect(toolIds).toContain('comparativo')
    expect(toolIds).toContain('parcelas')
    expect(toolIds).toContain('metas')
    expect(toolIds).toContain('dados')
    expect(toolIds).toContain('importar')
    expect(toolIds).toContain('configuracoes')

    // Template tool should be excluded
    expect(toolIds).not.toContain('template')

    // Order must be strictly ascending
    for (let i = 0; i < tools.length - 1; i++) {
      expect(tools[i].order).toBeLessThanOrEqual(tools[i + 1].order)
    }
  })
})
