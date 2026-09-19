import type { Bundle, Composition, Condition, Encounter, Patient } from 'fhir/r4'
import { examplePatients, loadExampleBundles } from './index'

function resources<T>(bundle: Bundle, type: string): T[] {
  return (bundle.entry ?? []).map((e) => e.resource).filter((r): r is NonNullable<typeof r> => r?.resourceType === type) as T[]
}

describe('Bundles RDA sintéticos', () => {
  for (const patient of examplePatients) {
    describe(patient.label, () => {
      let bundles: Bundle[]
      beforeAll(async () => {
        bundles = await loadExampleBundles(patient)
      })

      it('carga todos los archivos del paciente', () => {
        expect(bundles).toHaveLength(patient.files.length)
      })

      it('cada archivo es un Bundle de tipo documento con Composition en la primera entrada', () => {
        for (const bundle of bundles) {
          expect(bundle.resourceType).toBe('Bundle')
          expect(bundle.type).toBe('document')
          expect(bundle.entry?.[0]?.resource?.resourceType).toBe('Composition')
        }
      })

      it('todos los Bundles son del mismo paciente', () => {
        const identifiers = bundles.map((b) => resources<Patient>(b, 'Patient')[0]?.identifier?.[0]?.value)
        expect(new Set(identifiers).size).toBe(1)
        expect(identifiers[0]).toBeDefined()
      })

      it('cada Condition referenciado desde Encounter.diagnosis y sectionProblems existe en el Bundle', () => {
        for (const bundle of bundles) {
          const conditionIds = new Set(resources<Condition>(bundle, 'Condition').map((c) => `Condition/${c.id}`))
          const encounter = resources<Encounter>(bundle, 'Encounter')[0]
          for (const d of encounter.diagnosis ?? []) {
            expect(conditionIds.has(d.condition.reference!)).toBe(true)
          }
          const composition = resources<Composition>(bundle, 'Composition')[0]
          const problems = composition.section?.find((s) => s.code?.coding?.[0]?.code === '11450-4')
          expect(problems).toBeDefined()
          for (const e of problems!.entry ?? []) {
            expect(conditionIds.has(e.reference!)).toBe(true)
          }
        }
      })
    })
  }

  it('el paciente 1 cubre los casos de prueba del spec', async () => {
    const [consulta1, urgencias, hospitalizacion, consulta2] = await loadExampleBundles(examplePatients[0])

    // CA-4: una sola atención con un único diagnóstico
    expect(resources<Condition>(consulta1, 'Condition')).toHaveLength(1)

    // CA-10: triage en urgencias
    const triage = resources<{ resourceType: 'Observation'; code: { coding: { code: string }[] } }>(urgencias, 'Observation')
    expect(triage[0]?.code.coding[0].code).toBe('225390008')

    // CA-5 y CA-8: complicación y diagnóstico resuelto en hospitalización
    const hospEncounter = resources<Encounter>(hospitalizacion, 'Encounter')[0]
    const uses = hospEncounter.diagnosis!.map((d) => d.use?.coding?.[0]?.code)
    expect(uses).toContain('263718001')
    const resolved = resources<Condition>(hospitalizacion, 'Condition').filter((c) => c.clinicalStatus?.coding?.[0]?.code === 'resolved')
    expect(resolved).toHaveLength(1)

    // CA-6: Condition solo en la sección, sin entrada en Encounter.diagnosis
    const ctrlEncounter = resources<Encounter>(consulta2, 'Encounter')[0]
    const referenced = new Set(ctrlEncounter.diagnosis!.map((d) => d.condition.reference))
    const onlyInSection = resources<Condition>(consulta2, 'Condition').filter((c) => !referenced.has(`Condition/${c.id}`))
    expect(onlyInSection.map((c) => c.code?.coding?.[0]?.code)).toEqual(['F32.1'])

    // CA-9: código sin mapeo
    expect(resources<Condition>(consulta2, 'Condition').some((c) => c.code?.coding?.[0]?.code === 'Z00.0')).toBe(true)
  })
})
