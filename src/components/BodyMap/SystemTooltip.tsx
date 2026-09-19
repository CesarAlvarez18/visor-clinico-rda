import { getBodySystem } from '../../rules/config/bodySystems'
import { LEVEL_LABELS } from '../../rules/levels'
import type { SystemState } from '../../rules/types'
import { tooltipSummary } from './tooltipSummary'

export interface TooltipPosition {
  left: number
  top: number
}

interface SystemTooltipProps {
  id: string
  state: SystemState | undefined
  position: TooltipPosition | undefined
}

/**
 * Tooltip accesible: siempre está en el DOM (los botones lo referencian con
 * aria-describedby) y se hace visible al pasar el cursor o enfocar un sistema.
 */
export function SystemTooltip({ id, state, position }: SystemTooltipProps) {
  const visible = Boolean(state && position)
  return (
    <div
      id={id}
      role="tooltip"
      className={`system-tooltip${visible ? ' system-tooltip--visible' : ''}`}
      style={position ? { left: position.left, top: position.top } : undefined}
      hidden={!visible}
    >
      {state && (
        <>
          <strong>{getBodySystem(state.systemId).name}</strong>
          <span className={`system-tooltip__level level--${state.level}`}>{LEVEL_LABELS[state.level]}</span>
          <span className="system-tooltip__summary">{tooltipSummary(state)}</span>
        </>
      )}
    </div>
  )
}
