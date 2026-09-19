import type { Bundle } from 'fhir/r4'
import consulta1 from '../data/examples/paciente-01/consulta-2025-11-03.json'
import hospitalizacion from '../data/examples/paciente-01/hospitalizacion-2026-03-15.json'
import consulta2 from '../data/examples/paciente-01/consulta-2026-08-20.json'
import urgencias from '../data/examples/paciente-01/urgencias-2026-03-14.json'
import type { DiagnosisEntry, EncounterRecord } from '../domain/types'
import { parseBundle } from '../fhir/parseBundle'
import { computeBodyState } from './computeBodyState'
import { BODY_SYSTEM_IDS } from './config/bodySystems'

function diagnosis(overrides: Partial<DiagnosisEntry> & { code: string }): DiagnosisEntry {
  return {
    conditionId: `cond-${overrides.code}`,
    display: overrides.code,
    clinicalStatus: 'active',
    isActive: true,
    encounterDate: '2026-01-01',
    ...overrides,
  }
}

function record(diagnoses: DiagnosisEntry[]): EncounterRecord {
  return {
    patient: { id: 'p', name: 'Paciente', sex: 'unknown' },
    encounter: { id: 'e', kind: 'ambulatory', start: '2026-01-01' },
    diagnoses,
  }
}

describe('computeBodyState', () => {
  it('CA-4: los sistemas sin diagnósticos quedan en "Sin datos", nunca en "Normal"', () => {
    const state = computeBodyState(parseBundle(consulta1 as Bundle))
    expect(state.systems.cardiovascular.level).toBe('moderate')
    for (const id of BODY_SYSTEM_IDS.filter((s) => s !== 'cardiovascular')) {
      expect(state.systems[id].level).toBe('no-data')
      expect(state.systems[id].cause).toBeUndefined()
      expect(state.systems[id].evidence).toHaveLength(0)
    }
    expect(state.hasDiagnoses).toBe(true)
  })

  it('una atención sin diagnósticos deja todo en "Sin datos" y lo indica', () => {
    const state = computeBodyState(record([]))
    expect(state.hasDiagnoses).toBe(false)
    expect(Object.values(state.systems).every((s) => s.level === 'no-data')).toBe(true)
  })

  it('CA-5: comorbilidad (Leve) + complicación (Grave) → Grave con la complicación como causa', () => {
    const state = computeBodyState(parseBundle(hospitalizacion as Bundle))
    const respiratory = state.systems.respiratory
    expect(respiratory.level).toBe('severe')
    expect(respiratory.cause?.diagnosis.code).toBe('J18.9')
    expect(respiratory.cause?.reason).toBe('complicación')
    expect(respiratory.evidence.map((e) => e.diagnosis.code)).toEqual(['J44.9', 'J18.9'])
  })

  it('CA-6: un diagnóstico sin rol aporta Leve con "rol no registrado"', () => {
    const state = computeBodyState(parseBundle(consulta2 as Bundle))
    const mental = state.systems.mental
    expect(mental.level).toBe('mild')
    expect(mental.cause?.diagnosis.code).toBe('F32.1')
    expect(mental.cause?.reason).toBe('rol no registrado')
  })

  it('CA-7: el nivel mínimo por código sobrescribe el rol', () => {
    const state = computeBodyState(parseBundle(urgencias as Bundle))
    const cardio = state.systems.cardiovascular
    expect(cardio.level).toBe('severe')
    expect(cardio.cause?.diagnosis.code).toBe('I21.0')
    expect(cardio.cause?.minLevelApplied).toBe(true)
    expect(cardio.cause?.reason).toMatch(/nivel mínimo/)
    // La hipertensión (comorbilidad) sigue listada como evidencia Leve.
    const hta = cardio.evidence.find((e) => e.diagnosis.code === 'I10')
    expect(hta?.contributedLevel).toBe('mild')
  })

  it('no aplica el nivel mínimo si el rol ya es igual o peor', () => {
    const state = computeBodyState(record([diagnosis({ code: 'I21.0', role: { code: '263718001' }, rank: 7 })]))
    expect(state.systems.cardiovascular.level).toBe('severe')
    expect(state.systems.cardiovascular.cause?.minLevelApplied).toBe(false)
    expect(state.systems.cardiovascular.cause?.reason).toBe('complicación')
  })

  it('CA-8: un diagnóstico resuelto no cuenta pero aparece como "no activo"', () => {
    const state = computeBodyState(parseBundle(hospitalizacion as Bundle))
    const digestive = state.systems.digestive
    expect(digestive.level).toBe('no-data')
    expect(digestive.cause).toBeUndefined()
    expect(digestive.evidence).toHaveLength(1)
    expect(digestive.evidence[0]).toMatchObject({ contributedLevel: null, reason: 'no activo' })
    expect(digestive.evidence[0].diagnosis.code).toBe('K29.7')
  })

  it('CA-9: un código sin mapeo va a "sin sistema asignado" y no afecta ningún sistema', () => {
    const state = computeBodyState(parseBundle(consulta2 as Bundle))
    expect(state.unmapped.map((d) => d.code)).toEqual(['Z00.0'])
    const allEvidence = Object.values(state.systems).flatMap((s) => s.evidence)
    expect(allEvidence.some((e) => e.diagnosis.code === 'Z00.0')).toBe(false)
  })

  it('en empate de nivel gana el de menor rank y las evidencias quedan ordenadas por rank', () => {
    const state = computeBodyState(
      record([
        diagnosis({ code: 'J45.0', role: { code: '398192003' }, rank: 4 }),
        diagnosis({ code: 'J06.9', role: { code: '398192003' }, rank: 2 }),
        diagnosis({ code: 'J30.1' }), // sin rank
      ]),
    )
    const respiratory = state.systems.respiratory
    expect(respiratory.level).toBe('mild')
    expect(respiratory.cause?.diagnosis.code).toBe('J06.9')
    expect(respiratory.evidence.map((e) => e.diagnosis.code)).toEqual(['J06.9', 'J45.0', 'J30.1'])
  })
})
