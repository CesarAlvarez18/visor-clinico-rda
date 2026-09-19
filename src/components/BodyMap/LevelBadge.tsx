import type { SystemLevel } from '../../rules/levels'
import { LABEL_X } from './bodyRegions'
import { LEVEL_STYLES } from './levelStyles'

interface LevelBadgeProps {
  level: SystemLevel
  side: 'left' | 'right'
  y: number
  /** Punto del órgano al que apunta la línea guía. */
  to: [number, number]
}

const CHAR_WIDTH = 5.4
const PADDING = 5
const HEIGHT = 15

/**
 * Rótulo de texto del nivel en el margen de la silueta, con una línea guía
 * hasta el órgano: el color nunca va solo.
 */
export function LevelBadge({ level, side, y, to }: LevelBadgeProps) {
  const style = LEVEL_STYLES[level]
  const text = style.short
  const width = text.length * CHAR_WIDTH + PADDING * 2
  const left = side === 'left' ? LABEL_X.left - width : LABEL_X.right
  const leaderStart = side === 'left' ? LABEL_X.left : LABEL_X.right

  return (
    <g className={`level-badge level-badge--${level}`} aria-hidden="true">
      <polyline
        points={`${leaderStart},${y} ${to[0]},${to[1]}`}
        fill="none"
        stroke={style.stroke}
        strokeWidth={1}
        strokeOpacity={0.8}
      />
      <circle cx={to[0]} cy={to[1]} r={2} fill={style.stroke} />
      <rect x={left} y={y - HEIGHT / 2} width={width} height={HEIGHT} rx={HEIGHT / 2} fill={style.badgeFill} stroke={style.stroke} strokeWidth={1} />
      <text x={left + width / 2} y={y + 3.5} textAnchor="middle" fontSize={9} fontWeight={600} fill={style.badgeText}>
        {text}
      </text>
    </g>
  )
}
