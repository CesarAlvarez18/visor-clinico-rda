import { MODEL_SYSTEM_IDS } from './classifyMesh'
import { computeSystemAnchors } from './anchors'
import { buildProceduralAnatomy } from './proceduralAnatomy'

describe('computeSystemAnchors', () => {
  it('calcula un ancla para cada sistema con estructura propia', () => {
    const anchors = computeSystemAnchors(buildProceduralAnatomy())
    for (const id of MODEL_SYSTEM_IDS) {
      expect(anchors.has(id)).toBe(true)
    }
  })

  it('usa un punto representativo (no el centro de todo el árbol) para vasos, nervios y huesos largos', () => {
    const anchors = computeSystemAnchors(buildProceduralAnatomy())
    // El árbol vascular se extiende por los cuatro miembros; el ancla debe
    // quedar cerca del corazón (x ≈ 0.025), no en x = 0 (centro simétrico).
    const cardiovascular = anchors.get('cardiovascular')!
    expect(Math.abs(cardiovascular.x)).toBeGreaterThan(0.01)
    expect(cardiovascular.y).toBeGreaterThan(1.2)
    expect(cardiovascular.y).toBeLessThan(1.35)

    // Los huesos largos están a ambos lados (izquierdo y derecho); el ancla
    // debe caer sobre uno de los dos fémures, no en x = 0.
    const musculoskeletal = anchors.get('musculoskeletal')!
    expect(Math.abs(musculoskeletal.x)).toBeGreaterThan(0.05)
  })

  it('usa el centro de la caja del sistema para órganos localizados en un solo lugar', () => {
    const anchors = computeSystemAnchors(buildProceduralAnatomy())
    const hepatic = anchors.get('hepatic')!
    // El hígado está a la izquierda del abdomen.
    expect(hepatic.x).toBeLessThan(0)
    expect(hepatic.y).toBeGreaterThan(1.0)
    expect(hepatic.y).toBeLessThan(1.25)
  })
})
