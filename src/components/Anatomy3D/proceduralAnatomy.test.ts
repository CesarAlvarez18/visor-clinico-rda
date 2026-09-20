import type { Mesh } from 'three'
import { classifyMesh, MODEL_SYSTEM_IDS } from './classifyMesh'
import { buildProceduralAnatomy } from './proceduralAnatomy'

describe('buildProceduralAnatomy', () => {
  it('trae al menos una malla de piel y de esqueleto sin sistema', () => {
    const kinds = new Set<string>()
    buildProceduralAnatomy().traverse((node) => {
      if ((node as Mesh).isMesh) kinds.add(classifyMesh(node).kind)
    })
    expect(kinds.has('skin')).toBe(true)
    expect(kinds.has('skeleton')).toBe(true)
  })

  it('trae al menos una malla clasificada en cada sistema con estructura propia', () => {
    const bySystem = new Map<string, number>()
    buildProceduralAnatomy().traverse((node) => {
      if (!(node as Mesh).isMesh) return
      const classification = classifyMesh(node)
      if (classification.kind === 'system') bySystem.set(classification.systemId, (bySystem.get(classification.systemId) ?? 0) + 1)
    })
    for (const id of MODEL_SYSTEM_IDS) {
      expect(bySystem.get(id) ?? 0).toBeGreaterThan(0)
    }
  })
})
