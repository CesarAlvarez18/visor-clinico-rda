import { BONE_COLOR, LEVEL_STYLES, TREE_NO_DATA } from '../BodyMap/levelStyles'
import { MODEL_SYSTEM_IDS } from './classifyMesh'
import { createModelMaterials, systemAppearance } from './levelMaterials'

describe('systemAppearance', () => {
  it('nunca devuelve un color de la escala de niveles para "Sin datos"', () => {
    for (const systemId of MODEL_SYSTEM_IDS) {
      const { color } = systemAppearance(systemId, 'no-data')
      const scaleColors = new Set(['normal', 'mild', 'moderate', 'severe'].map((level) => LEVEL_STYLES[level as keyof typeof LEVEL_STYLES].badgeFill))
      expect(scaleColors.has(color)).toBe(false)
    }
  })

  it('vasos y nervios sin datos no son rojo ni amarillo, usan su tono neutro propio', () => {
    expect(systemAppearance('cardiovascular', 'no-data').color).toBe(TREE_NO_DATA.vessels)
    expect(systemAppearance('nervous', 'no-data').color).toBe(TREE_NO_DATA.nerves)
  })

  it('el musculoesquelético sin datos usa el color hueso', () => {
    expect(systemAppearance('musculoskeletal', 'no-data').color).toBe(BONE_COLOR)
  })

  it('cada nivel de la escala devuelve el color de LEVEL_STYLES', () => {
    for (const level of ['normal', 'mild', 'moderate', 'severe'] as const) {
      expect(systemAppearance('hepatic', level).color).toBe(LEVEL_STYLES[level].badgeFill)
    }
  })

  it('la emisión sin datos queda por debajo de la de cualquier nivel con datos', () => {
    const noData = systemAppearance('renal', 'no-data').emissiveIntensity
    for (const level of ['normal', 'mild', 'moderate', 'severe'] as const) {
      expect(systemAppearance('renal', level).emissiveIntensity).toBeGreaterThan(noData)
    }
  })
})

describe('createModelMaterials', () => {
  it('crea un material por sistema del modelo y no los recrea al actualizar', () => {
    const materials = createModelMaterials()
    const before = new Map(MODEL_SYSTEM_IDS.map((id) => [id, materials.systems.get(id)]))
    materials.update({ systems: {}, unmapped: [], hasDiagnoses: false } as never)
    for (const id of MODEL_SYSTEM_IDS) {
      expect(materials.systems.get(id)).toBe(before.get(id))
    }
    materials.dispose()
  })

  it('resalta con más emisión y sostiene la emisión más alta al seleccionar', () => {
    const materials = createModelMaterials()
    const bodyState = {
      systems: Object.fromEntries(MODEL_SYSTEM_IDS.map((id) => [id, { systemId: id, level: 'moderate', evidence: [] }])),
      unmapped: [],
      hasDiagnoses: true,
    } as never

    materials.update(bodyState)
    const base = materials.systems.get('hepatic')!.emissiveIntensity

    materials.update(bodyState, 'hepatic')
    const highlighted = materials.systems.get('hepatic')!.emissiveIntensity
    expect(highlighted).toBeGreaterThan(base)

    materials.update(bodyState, undefined, 'hepatic')
    const selected = materials.systems.get('hepatic')!.emissiveIntensity
    expect(selected).toBeGreaterThan(highlighted)

    materials.dispose()
  })
})
