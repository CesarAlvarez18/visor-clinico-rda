import type { KeyboardEvent, MouseEvent, FocusEvent } from 'react'
import { getBodySystem } from '../../rules/config/bodySystems'
import { LEVEL_LABELS } from '../../rules/levels'
import type { SystemState } from '../../rules/types'
import { BoneStrokes } from './BoneStrokes'
import { LevelBadge } from './LevelBadge'
import type { RegionShape } from './bodyRegions'
import { GLOW_FILTER_ID, LEVEL_STYLES, ORGAN_SHEEN_ID } from './levelStyles'

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
  const hasLevel = state.level !== 'no-data'
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
      {shape.strokes ? (
        <>
          {/* Zona sensible de la extremidad: tinte tenue del nivel; el color va en los huesos. */}
          <path
            className="system-region__area"
            d={shape.d}
            fill={hasLevel ? style.badgeFill : 'transparent'}
            fillOpacity={0.14}
            stroke={selected ? '#ffffff' : 'none'}
            strokeWidth={selected ? 1.2 : 0}
          />
          <g className="system-region__strokes" filter={hasLevel ? `url(#${GLOW_FILTER_ID})` : undefined}>
            <BoneStrokes strokes={shape.strokes} color={hasLevel ? style.stroke : undefined} />
          </g>
        </>
      ) : (
        <>
          <path
            d={shape.d}
            fill={style.fill}
            stroke={selected ? '#ffffff' : style.stroke}
            strokeWidth={selected ? 2.5 : 1.2}
            filter={`url(#${GLOW_FILTER_ID})`}
          />
          {/* Reflejo que da volumen de "gel" al órgano; solo cuando hay nivel. */}
          {hasLevel && <path className="system-region__sheen" d={shape.d} fill={`url(#${ORGAN_SHEEN_ID})`} />}
        </>
      )}
      <LevelBadge level={state.level} side={shape.label.side} y={shape.label.y} to={shape.label.to} />
    </g>
  )
}
