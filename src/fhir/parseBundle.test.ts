import type { Bundle } from 'fhir/r4'
import consulta1 from '../data/examples/paciente-01/consulta-2025-11-03.json'
import urgencias from '../data/examples/paciente-01/urgencias-2026-03-14.json'
import hospitalizacion from '../data/examples/paciente-01/hospitalizacion-2026-03-15.json'
import consulta2 from '../data/examples/paciente-01/consulta-2026-08-20.json'
import { parseBundle } from './parseBundle'

describe('parseBundle', () => {
  it('extrae paciente, atención y prestador de una consulta externa', () => {
    const record = parseBundle(consulta1 as Bundle)

    expect(record.patient).toMatchObject({
      identifier: '999999001',
      identifierType: 'CC',
      name: 'Paciente Prueba Uno',
      sex: 'male',
      birthDate: '1962-04-15',
    })
    expect(record.encounter).toMatchObject({
      id: 'enc-p1-2025-11-03',
      kind: 'ambulatory',
      start: '2025-11-03T08:30:00-05:00',
      practitionerName: 'Médica General Ejemplo',
      organizationName: 'IPS Consulta Ejemplo',
    })
    expect(record.encounter.triage).toBeUndefined()
    expect(record.ageAtEncounter).toBe(63)
  })

  it('lee los diagnósticos con su rol, rank y tipo', () => {
    const record = parseBundle(consulta1 as Bundle)
    expect(record.diagnoses).toHaveLength(1)
    expect(record.diagnoses[0]).toMatchObject({
      code: 'I10',
      codeSystem: 'http://hl7.org/fhir/sid/icd-10',
      display: 'Hipertensión esencial (primaria)',
      clinicalStatus: 'active',
      isActive: true,
      role: { code: '8319008', display: 'diagnóstico primario' },
      rank: 1,
      diagnosisType: { code: '03', display: 'Confirmado Repetido' },
      practitionerName: 'Médica General Ejemplo',
      organizationName: 'IPS Consulta Ejemplo',
      encounterDate: '2025-11-03T08:30:00-05:00',
    })
  })

  it('detecta urgencias y su triage', () => {
    const record = parseBundle(urgencias as Bundle)
    expect(record.encounter.kind).toBe('emergency')
    expect(record.encounter.triage).toEqual({
      code: '02',
      display: 'Triage II',
      effectiveDateTime: '2026-03-14T22:15:00-05:00',
    })
    expect(record.diagnoses.map((d) => d.role?.code)).toEqual(['52870002', '89100005', '398192003'])
  })

  it('marca como no activo un diagnóstico resuelto y conserva la complicación', () => {
    const record = parseBundle(hospitalizacion as Bundle)
    expect(record.encounter.kind).toBe('hospitalization')
    expect(record.diagnoses).toHaveLength(6)

    const gastritis = record.diagnoses.find((d) => d.code === 'K29.7')
    expect(gastritis).toMatchObject({ clinicalStatus: 'resolved', isActive: false })

    const neumonia = record.diagnoses.find((d) => d.code === 'J18.9')
    expect(neumonia).toMatchObject({ role: { code: '263718001' }, rank: 7, isActive: true })
  })

  it('incluye sin rol los Condition que solo están en sectionProblems', () => {
    const record = parseBundle(consulta2 as Bundle)
    expect(record.diagnoses).toHaveLength(4)
    const depresion = record.diagnoses.find((d) => d.code === 'F32.1')
    expect(depresion).toBeDefined()
    expect(depresion?.role).toBeUndefined()
    expect(depresion?.rank).toBeUndefined()
    expect(depresion?.isActive).toBe(true)
  })

  it('resuelve referencias relativas sin tipo, como en los ejemplos oficiales', () => {
    const bundle: Bundle = {
      resourceType: 'Bundle',
      type: 'document',
      entry: [
        {
          fullUrl: 'urn:uuid:comp-1',
          resource: {
            resourceType: 'Composition',
            status: 'final',
            type: { coding: [{ system: 'http://loinc.org', code: '60591-5' }] },
            date: '2026-01-10',
            author: [{ reference: 'CC-22699214' }],
            title: 'RDA Consulta',
            subject: { reference: 'CC-80189301' },
            encounter: { reference: 'enc-1' },
            section: [
              {
                code: { coding: [{ system: 'http://loinc.org', code: '11450-4' }] },
                entry: [{ reference: 'Condition-0' }, { reference: 'Condition-1' }],
              },
            ],
          },
        },
        {
          resource: {
            resourceType: 'Patient',
            id: 'CC-80189301',
            name: [{ family: 'Ejemplo', given: ['Persona'] }],
            gender: 'female',
          },
        },
        {
          resource: {
            resourceType: 'Encounter',
            id: 'enc-1',
            status: 'finished',
            class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' },
            period: { start: '2026-01-10T10:00:00-05:00' },
            participant: [{ individual: { reference: 'CC-22699214' } }],
            serviceProvider: { reference: '4443000277' },
            diagnosis: [
              { condition: { reference: 'Condition-0' }, use: { text: 'diagnóstico primario' }, rank: 1 },
            ],
          },
        },
        { resource: { resourceType: 'Practitioner', id: 'CC-22699214', name: [{ text: 'Dra. Ejemplo' }] } },
        { resource: { resourceType: 'Organization', id: '4443000277', name: 'Hospital General Central' } },
        {
          resource: {
            resourceType: 'Condition',
            id: 'Condition-0',
            code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'A05.9', display: 'Intoxicación alimentaria bacteriana' }] },
            subject: { reference: 'CC-80189301' },
          },
        },
        {
          resource: {
            resourceType: 'Condition',
            id: 'Condition-1',
            code: { coding: [{ system: 'http://hl7.org/fhir/sid/icd-10', code: 'E11.9' }] },
            subject: { reference: 'CC-80189301' },
          },
        },
      ],
    }

    const record = parseBundle(bundle)
    expect(record.patient.name).toBe('Persona Ejemplo')
    expect(record.encounter.practitionerName).toBe('Dra. Ejemplo')
    expect(record.encounter.organizationName).toBe('Hospital General Central')
    expect(record.diagnoses.map((d) => d.code)).toEqual(['A05.9', 'E11.9'])
    // Sin clinicalStatus la guía asume "active"; use con solo text se conserva como rol.
    expect(record.diagnoses[0]).toMatchObject({ clinicalStatus: 'active', isActive: true, role: { code: 'diagnóstico primario' } })
    expect(record.diagnoses[1].role).toBeUndefined()
    expect(record.diagnoses[1].display).toBe('E11.9')
  })
})
