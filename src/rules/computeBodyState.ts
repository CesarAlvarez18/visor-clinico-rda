import type { DiagnosisEntry, EncounterRecord } from '../domain/types'
import { BODY_SYSTEM_IDS, type BodySystemId } from './config/bodySystems'
import { levelForRole } from './config/diagnosisRoleLevel'
import { severityOf, worstLevel, type Level } from './levels'
import { mapIcd10 } from './mapIcd10'
import type { BodyState, Evidence, SystemState } from './types'

export const INACTIVE_REASON = 'no activo'

/**
 * Calcula el nivel de afectación de cada sistema corporal para una atención.
 * Función pura: recibe el registro de la atención y devuelve, por sistema, el
 * nivel, la lista de evidencias y la que determinó el nivel ("gana el peor").
 * Un sistema sin diagnósticos activos queda en "Sin datos", nunca en "Normal".
 */
export function computeBodyState(record: EncounterRecord): BodyState {
  const evidenceBySystem = new Map<BodySystemId, Evidence[]>()
  const unmapped: DiagnosisEntry[] = []

  for (const diagnosis of record.diagnoses) {
    const mapping = mapIcd10(diagnosis.code)
    if (!mapping) {
      unmapped.push(diagnosis)
      continue
    }
    const list = evidenceBySystem.get(mapping.system) ?? []
    list.push(toEvidence(diagnosis, mapping.minLevel))
    evidenceBySystem.set(mapping.system, list)
  }

  const systems = {} as Record<BodySystemId, SystemState>
  for (const systemId of BODY_SYSTEM_IDS) {
    systems[systemId] = summarizeSystem(systemId, evidenceBySystem.get(systemId) ?? [])
  }

  return { systems, unmapped, hasDiagnoses: record.diagnoses.length > 0 }
}

function toEvidence(diagnosis: DiagnosisEntry, minLevel: Level | undefined): Evidence {
  if (!diagnosis.isActive) {
    return { diagnosis, contributedLevel: null, reason: INACTIVE_REASON, minLevelApplied: false }
  }
  const byRole = levelForRole(diagnosis.role?.code)
  if (minLevel && severityOf(minLevel) > severityOf(byRole.level)) {
    return { diagnosis, contributedLevel: minLevel, reason: 'nivel mínimo por código CIE-10', minLevelApplied: true }
  }
  return { diagnosis, contributedLevel: byRole.level, reason: byRole.reason, minLevelApplied: false }
}

function summarizeSystem(systemId: BodySystemId, evidence: Evidence[]): SystemState {
  const sorted = [...evidence].sort(byRank)
  let cause: Evidence | undefined
  let level: Level | undefined

  for (const item of sorted) {
    if (item.contributedLevel === null) continue
    if (!level || worstLevel(level, item.contributedLevel) !== level) {
      // Mayor gravedad, o primera evidencia activa. En empate se conserva la
      // primera (menor rank) porque el orden ya es por rank.
      level = item.contributedLevel
      cause = item
    }
  }

  return { systemId, level: level ?? 'no-data', evidence: sorted, cause }
}

function byRank(a: Evidence, b: Evidence): number {
  const ra = a.diagnosis.rank ?? Number.POSITIVE_INFINITY
  const rb = b.diagnosis.rank ?? Number.POSITIVE_INFINITY
  return ra - rb
}
