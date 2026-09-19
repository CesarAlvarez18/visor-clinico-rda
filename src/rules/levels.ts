// Escala de afectación de un sistema corporal. "Sin datos" es un estado
// explícito y nunca equivale a "Normal".

export type Level = 'normal' | 'mild' | 'moderate' | 'severe'

export type SystemLevel = Level | 'no-data'

/** Orden de gravedad; a mayor índice, peor. */
const SEVERITY_ORDER: Record<Level, number> = {
  normal: 0,
  mild: 1,
  moderate: 2,
  severe: 3,
}

export const LEVEL_LABELS: Record<SystemLevel, string> = {
  normal: 'Normal',
  mild: 'Leve',
  moderate: 'Moderado',
  severe: 'Grave',
  'no-data': 'Sin datos',
}

export function severityOf(level: Level): number {
  return SEVERITY_ORDER[level]
}

/** Devuelve el peor de dos niveles ("gana el peor"). */
export function worstLevel(a: Level, b: Level): Level {
  return severityOf(a) >= severityOf(b) ? a : b
}
