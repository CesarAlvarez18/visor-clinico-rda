import type { KeyboardEvent, MouseEvent, FocusEvent } from 'react'
import { getBodySystem } from '../../rules/config/bodySystems'
import { LEVEL_LABELS } from '../../rules/levels'
import type { SystemState } from '../../rules/types'
import { LevelBadge } from './LevelBadge'
import type { RegionShape } from './bodyRegions'
import { LEVEL_STYLES } from './levelStyles'

interface SystemRegionProps {
  shape: RegionShape
  state: SystemState
  selected: boolean
  tooltipId: string
  onSelect: () => void
  onHover: (target: SVGGElement | null) => void
}

export function SystemRegion({ shape, state, selected, tooltipId, onSelect, onHover }: SystemRegionProps) {
  const system = getBodySystem(shape.systemId)
  const style = LEVEL_STYLES[state.level]
  const label = `${system.name}: ${LEVEL_LABELS[state.level]}`

  const handleKey = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }
  const enter = (event: MouseEvent<SVGGElement> | FocusEvent<SVGGElement>) => onHover(event.currentTarget)
  const leave = () => onHover(null)

  return (
    <g
      className={`system-region level--${state.level}${selected ? ' system-region--selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      aria-describedby={tooltipId}
      data-system={shape.systemId}
      onClick={onSelect}
      onKeyDown={handleKey}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
    >
      <title>{label}</title>
      <path d={shape.d} fill={style.fill} stroke={selected ? '#1d5c8a' : style.stroke} strokeWidth={selected ? 3 : 1.4} />
      <LevelBadge level={state.level} x={shape.label.x} y={shape.label.y} anchor={shape.label.anchor} />
    </g>
  )
}
