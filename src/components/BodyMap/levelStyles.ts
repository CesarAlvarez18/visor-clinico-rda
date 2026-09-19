import type { SystemLevel } from '../../rules/levels'

// Paleta de los cinco estados. Tomada de la paleta de Okabe-Ito (apta para
// daltonismo) más un rojo oscuro para "Grave", de modo que los niveles se
// distingan también por luminosidad. "Sin datos" usa gris con trama de rayas
// para que nunca se confunda con un color de nivel.
export interface LevelStyle {
  fill: string
  stroke: string
  /** Color del texto sobre el relleno (contraste ≥ 4.5:1). */
  text: string
  /** Etiqueta corta para rótulos dentro de la silueta. */
  short: string
}

export const LEVEL_STYLES: Record<SystemLevel, LevelStyle> = {
  normal: { fill: '#009E73', stroke: '#00654a', text: '#1f2933', short: 'Normal' },
  mild: { fill: '#F0E442', stroke: '#8a7d00', text: '#1f2933', short: 'Leve' },
  moderate: { fill: '#E69F00', stroke: '#8f5f00', text: '#1f2933', short: 'Moderado' },
  severe: { fill: '#A50F15', stroke: '#5e070c', text: '#ffffff', short: 'Grave' },
  'no-data': { fill: 'url(#level-no-data-pattern)', stroke: '#6b7280', text: '#1f2933', short: 'Sin datos' },
}

export const NO_DATA_PATTERN_ID = 'level-no-data-pattern'
