import type { SystemLevel } from '../../rules/levels'

// Paleta de los cinco estados sobre el fondo oscuro de la silueta (estilo
// radiografía). Los niveles se distinguen por tono y por luminosidad, y
// siempre van acompañados de texto. "Sin datos" es el trazado cian
// translúcido del cuerpo, sin color de nivel, para que nunca se confunda
// con "Normal".
export interface LevelStyle {
  /** Relleno de la región en la silueta. */
  fill: string
  /** Borde de la región; también da el color del resplandor. */
  stroke: string
  /** Fondo del rótulo de texto. */
  badgeFill: string
  /** Color del texto del rótulo (contraste ≥ 4.5:1 sobre badgeFill). */
  badgeText: string
  /** Etiqueta corta para rótulos dentro de la silueta. */
  short: string
}

export const NO_DATA_PATTERN_ID = 'level-no-data-pattern'
export const GLOW_FILTER_ID = 'body-glow'

export const LEVEL_STYLES: Record<SystemLevel, LevelStyle> = {
  normal: { fill: 'rgba(0, 196, 140, 0.75)', stroke: '#4dffc9', badgeFill: '#00c48c', badgeText: '#062a36', short: 'Normal' },
  mild: { fill: 'rgba(245, 230, 99, 0.8)', stroke: '#fff59a', badgeFill: '#f5e663', badgeText: '#062a36', short: 'Leve' },
  moderate: { fill: 'rgba(255, 159, 28, 0.85)', stroke: '#ffc46b', badgeFill: '#ff9f1c', badgeText: '#062a36', short: 'Moderado' },
  severe: { fill: 'rgba(229, 37, 61, 0.9)', stroke: '#ff8595', badgeFill: '#e5253d', badgeText: '#ffffff', short: 'Grave' },
  'no-data': {
    fill: `url(#${NO_DATA_PATTERN_ID})`,
    stroke: '#4fd6ff',
    badgeFill: 'rgba(6, 42, 54, 0.9)',
    badgeText: '#bff2ff',
    short: 'Sin datos',
  },
}
