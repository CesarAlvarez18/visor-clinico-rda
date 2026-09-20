import { getBodySystem, type BodySystemId } from '../../rules/config/bodySystems'
import { LEVEL_LABELS } from '../../rules/levels'
import type { BodyState } from '../../rules/types'
import { MODEL_SYSTEM_IDS } from './classifyMesh'

interface SystemListProps {
  bodyState: BodyState
  selectedSystemId?: BodySystemId
  onHighlight: (systemId: BodySystemId | undefined) => void
  onSelect: (systemId: BodySystemId) => void
}

/**
 * Alternativa textual y operable con teclado a los 9 sistemas del modelo 3D
 * (CA-19, CA-20): el lienzo lleva `aria-hidden` y esta lista es la fuente de
 * verdad para un lector de pantalla. El foco resalta el sistema en el
 * modelo; Enter (comportamiento nativo del botón) o clic abre el panel.
 */
export function SystemList({ bodyState, selectedSystemId, onHighlight, onSelect }: SystemListProps) {
  return (
    <ul className="system-list" aria-label="Sistemas del modelo anatómico">
      {MODEL_SYSTEM_IDS.map((systemId) => {
        const state = bodyState.systems[systemId]
        const system = getBodySystem(systemId)
        const selected = selectedSystemId === systemId
        return (
          <li key={systemId}>
            <button
              type="button"
              className={`system-list__item level--${state.level}${selected ? ' system-list__item--selected' : ''}`}
              aria-label={`${system.name}: ${LEVEL_LABELS[state.level]}`}
              aria-pressed={selected}
              data-system={systemId}
              onFocus={() => onHighlight(systemId)}
              onBlur={() => onHighlight(undefined)}
              onMouseEnter={() => onHighlight(systemId)}
              onMouseLeave={() => onHighlight(undefined)}
              onClick={() => onSelect(systemId)}
            >
              <span className="system-list__swatch" aria-hidden="true" />
              <span className="system-list__name">{system.name}</span>
              <span className="system-list__level">{LEVEL_LABELS[state.level]}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
