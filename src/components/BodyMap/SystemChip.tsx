import type { FocusEvent, MouseEvent } from 'react'
import { getBodySystem } from '../../rules/config/bodySystems'
import { LEVEL_LABELS } from '../../rules/levels'
import type { SystemState } from '../../rules/types'

interface SystemChipProps {
  state: SystemState
  selected: boolean
  tooltipId: string
  onSelect: () => void
  onHover: (target: HTMLElement | null) => void
}

/** Sistemas sin órgano localizable (piel, hematológico, salud mental). */
export function SystemChip({ state, selected, tooltipId, onSelect, onHover }: SystemChipProps) {
  const system = getBodySystem(state.systemId)
  const enter = (event: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>) => onHover(event.currentTarget)
  const leave = () => onHover(null)

  return (
    <button
      type="button"
      className={`system-chip level--${state.level}${selected ? ' system-chip--selected' : ''}`}
      aria-label={`${system.name}: ${LEVEL_LABELS[state.level]}`}
      aria-pressed={selected}
      aria-describedby={tooltipId}
      data-system={state.systemId}
      onClick={onSelect}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={enter}
      onBlur={leave}
    >
      <span className="system-chip__swatch" aria-hidden="true" />
      <span className="system-chip__name">{system.name}</span>
      <span className="system-chip__level">{LEVEL_LABELS[state.level]}</span>
    </button>
  )
}
