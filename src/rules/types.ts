import type { DiagnosisEntry } from '../domain/types'
import type { BodySystemId } from './config/bodySystems'
import type { Level, SystemLevel } from './levels'

/** Un diagnóstico y el nivel que aporta a su sistema, con el motivo. */
export interface Evidence {
  diagnosis: DiagnosisEntry
  /** null cuando el diagnóstico no está activo y por tanto no cuenta. */
  contributedLevel: Level | null
  /** Explicación corta en español: "complicación", "rol no registrado", "no activo"... */
  reason: string
  /** true si el nivel viene del mínimo fijado por código en la tabla CIE-10. */
  minLevelApplied: boolean
}

export interface SystemState {
  systemId: BodySystemId
  level: SystemLevel
  /** Todas las evidencias del sistema, ordenadas por rank (las sin rank al final). */
  evidence: Evidence[]
  /** La evidencia que determinó el nivel final. Ausente si el sistema no tiene datos. */
  cause?: Evidence
}

export interface BodyState {
  systems: Record<BodySystemId, SystemState>
  /** Diagnósticos cuyo código CIE-10 no está en el mapeo. */
  unmapped: DiagnosisEntry[]
  /** false si la atención no registró ningún diagnóstico. */
  hasDiagnoses: boolean
}
