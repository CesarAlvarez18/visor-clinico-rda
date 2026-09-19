// PENDIENTE DE VALIDACIÓN CLÍNICA.
//
// Nivel que aporta un diagnóstico según su rol en la atención
// (Encounter.diagnosis.use, CodeSystem ColombianDiagnosisRole; ver
// docs/reference/rda-codes.md). ConditionRDA no permite `severity`, así que el
// rol es la única señal de gravedad que trae el RDA.

import type { Level } from '../levels'

export interface RoleLevelRule {
  level: Level
  reason: string
}

export const DIAGNOSIS_ROLE_LEVEL: Readonly<Record<string, RoleLevelRule>> = {
  '263718001': { level: 'severe', reason: 'complicación' },
  '16100001': { level: 'severe', reason: 'causa de muerte' },
  '52870002': { level: 'moderate', reason: 'diagnóstico de ingreso' },
  '89100005': { level: 'moderate', reason: 'diagnóstico final (alta)' },
  '8319008': { level: 'moderate', reason: 'diagnóstico primario' },
  '398192003': { level: 'mild', reason: 'comorbilidad' },
}

/** Diagnóstico sin rol registrado (solo en la sección) o con rol desconocido. */
export const DEFAULT_ROLE_LEVEL: RoleLevelRule = { level: 'mild', reason: 'rol no registrado' }

export function levelForRole(roleCode: string | undefined): RoleLevelRule {
  if (!roleCode) return DEFAULT_ROLE_LEVEL
  return DIAGNOSIS_ROLE_LEVEL[roleCode] ?? { level: DEFAULT_ROLE_LEVEL.level, reason: `rol no reconocido (${roleCode})` }
}
