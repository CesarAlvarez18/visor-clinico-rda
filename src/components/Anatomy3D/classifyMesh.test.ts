import { BODY_SYSTEM_IDS } from '../../rules/config/bodySystems'
import { classifyMesh, MODEL_SYSTEM_IDS } from './classifyMesh'

describe('classifyMesh', () => {
  it('clasifica estructuras de sistema por el nombre, en inglés o español', () => {
    expect(classifyMesh({ name: 'Heart' })).toEqual({ kind: 'system', systemId: 'cardiovascular' })
    expect(classifyMesh({ name: 'Arteria carótida' })).toEqual({ kind: 'system', systemId: 'cardiovascular' })
    expect(classifyMesh({ name: 'Hígado' })).toEqual({ kind: 'system', systemId: 'hepatic' })
    expect(classifyMesh({ name: 'Lung_L' })).toEqual({ kind: 'system', systemId: 'respiratory' })
    expect(classifyMesh({ name: 'Kidney_R' })).toEqual({ kind: 'system', systemId: 'renal' })
    expect(classifyMesh({ name: 'Thyroid' })).toEqual({ kind: 'system', systemId: 'endocrine' })
    expect(classifyMesh({ name: 'Uterus' })).toEqual({ kind: 'system', systemId: 'reproductive' })
    expect(classifyMesh({ name: 'Stomach' })).toEqual({ kind: 'system', systemId: 'digestive' })
    expect(classifyMesh({ name: 'Brain' })).toEqual({ kind: 'system', systemId: 'nervous' })
  })

  it('clasifica huesos largos como musculoesquelético y el resto del esqueleto como skeleton', () => {
    expect(classifyMesh({ name: 'Femur_L' })).toEqual({ kind: 'system', systemId: 'musculoskeletal' })
    expect(classifyMesh({ name: 'Humerus_R' })).toEqual({ kind: 'system', systemId: 'musculoskeletal' })
    expect(classifyMesh({ name: 'Skull' })).toEqual({ kind: 'skeleton' })
    expect(classifyMesh({ name: 'Vertebra_12' })).toEqual({ kind: 'skeleton' })
  })

  it('reconoce el contrato exacto `system:<id>`', () => {
    expect(classifyMesh({ name: 'system:cardiovascular' })).toEqual({ kind: 'system', systemId: 'cardiovascular' })
    expect(classifyMesh({ name: 'system:hepatic' })).toEqual({ kind: 'system', systemId: 'hepatic' })
  })

  it('ignora un tag `system:` con un id que no existe', () => {
    expect(classifyMesh({ name: 'system:invented' })).toEqual({ kind: 'skeleton' })
  })

  it('clasifica la piel por el nombre', () => {
    expect(classifyMesh({ name: 'Body_Surface' })).toEqual({ kind: 'skin' })
    expect(classifyMesh({ name: 'Piel' })).toEqual({ kind: 'skin' })
  })

  it('hereda la clasificación del ancestro más cercano con coincidencia', () => {
    const skeletonGroup = { name: 'skeleton', parent: { name: 'Scene' } }
    expect(classifyMesh({ name: 'Object_12', parent: skeletonGroup })).toEqual({ kind: 'skeleton' })

    const systemGroup = { name: 'system:hepatic', parent: { name: 'Scene' } }
    expect(classifyMesh({ name: 'Object_7', parent: systemGroup })).toEqual({ kind: 'system', systemId: 'hepatic' })

    // El nombre de la propia malla gana sobre el del grupo ancestro.
    expect(classifyMesh({ name: 'heart', parent: skeletonGroup })).toEqual({ kind: 'system', systemId: 'cardiovascular' })
  })

  it('sin ninguna coincidencia en la jerarquía, trata la malla como esqueleto (sin sistema, no clicable)', () => {
    expect(classifyMesh({ name: 'Object_3', parent: { name: 'Scene' } })).toEqual({ kind: 'skeleton' })
  })
})

describe('MODEL_SYSTEM_IDS', () => {
  it('son los 9 sistemas con estructura propia (display: region)', () => {
    expect(MODEL_SYSTEM_IDS).toHaveLength(9)
    for (const id of MODEL_SYSTEM_IDS) expect(BODY_SYSTEM_IDS).toContain(id)
    // Los tres chips (sin órgano localizable) no están en el modelo.
    expect(MODEL_SYSTEM_IDS).not.toContain('integumentary')
    expect(MODEL_SYSTEM_IDS).not.toContain('hematologic')
    expect(MODEL_SYSTEM_IDS).not.toContain('mental')
  })
})
