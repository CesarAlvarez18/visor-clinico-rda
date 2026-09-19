import invalido from '../data/examples/invalido.json'
import consulta from '../data/examples/paciente-01/consulta-2025-11-03.json'
import { validateBundle } from './validateBundle'

describe('validateBundle', () => {
  it('acepta un Bundle RDA de atención', () => {
    const result = validateBundle(consulta, 'consulta.json')
    expect(result.ok).toBe(true)
  })

  it('rechaza un Bundle que no es documento ni tiene Composition', () => {
    const result = validateBundle(invalido, 'invalido.json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/no es un documento RDA/)
  })

  it('rechaza lo que no es un recurso FHIR', () => {
    expect(validateBundle('texto').ok).toBe(false)
    expect(validateBundle(null).ok).toBe(false)
    expect(validateBundle([1, 2]).ok).toBe(false)
    const result = validateBundle({ resourceType: 'Patient' }, 'paciente.json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/no es un Bundle FHIR/)
  })

  it('rechaza un documento sin Composition al inicio o sin Patient/Encounter', () => {
    const sinComposition = { resourceType: 'Bundle', type: 'document', entry: [{ resource: { resourceType: 'Patient' } }] }
    expect(validateBundle(sinComposition).ok).toBe(false)

    const sinEncounter = {
      resourceType: 'Bundle',
      type: 'document',
      entry: [{ resource: { resourceType: 'Composition' } }, { resource: { resourceType: 'Patient' } }],
    }
    const result = validateBundle(sinEncounter, 'x.json')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/Encounter/)
  })
})
