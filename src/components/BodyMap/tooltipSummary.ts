import type { SystemState } from '../../rules/types'

/** Motivo principal del nivel, para el tooltip: "I21.0 Infarto… (nivel mínimo por código CIE-10)". */
export function tooltipSummary(state: SystemState): string {
  const cause = state.cause
  if (!cause) return 'Sin diagnósticos asociados en esta atención'
  return `${cause.diagnosis.code} ${cause.diagnosis.display} (${cause.reason})`
}
