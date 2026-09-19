import type { SystemLevel } from '../../rules/levels'
import { LEVEL_STYLES } from './levelStyles'

interface LevelBadgeProps {
  level: SystemLevel
  x: number
  y: number
  anchor?: 'start' | 'middle' | 'end'
}

const CHAR_WIDTH = 5.4
const PADDING = 5
const HEIGHT = 15

/** Rótulo de texto del nivel dentro del SVG: el color nunca va solo. */
export function LevelBadge({ level, x, y, anchor = 'middle' }: LevelBadgeProps) {
  const style = LEVEL_STYLES[level]
  const text = style.short
  const width = text.length * CHAR_WIDTH + PADDING * 2
  const left = anchor === 'start' ? x : anchor === 'end' ? x - width : x - width / 2

  return (
    <g className={`level-badge level-badge--${level}`} aria-hidden="true">
      <rect x={left} y={y - HEIGHT / 2} width={width} height={HEIGHT} rx={HEIGHT / 2} fill={style.fill} stroke={style.stroke} strokeWidth={1} />
      <text x={left + width / 2} y={y + 3.5} textAnchor="middle" fontSize={9} fontWeight={600} fill={style.text}>
        {text}
      </text>
    </g>
  )
}
