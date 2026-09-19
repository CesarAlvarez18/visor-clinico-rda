import { useEffect, useRef } from 'react'
import type { EncounterSummary } from '../domain/types'
import { getBodySystem } from '../rules/config/bodySystems'
import { LEVEL_LABELS } from '../rules/levels'
import type { SystemState } from '../rules/types'
import { DiagnosisItem } from './DiagnosisItem'
import { ENCOUNTER_KIND_LABELS, formatDate } from './format'

interface SystemDetailPanelProps {
  state: SystemState
  encounter: EncounterSummary
  onClose: () => void
}

/** Panel lateral que explica el nivel de un sistema con los diagnósticos que lo producen. */
export function SystemDetailPanel({ state, encounter, onClose }: SystemDetailPanelProps) {
  const system = getBodySystem(state.systemId)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Al abrir o cambiar de sistema, el foco va al título para lectores de
  // pantalla, sin desplazar la página: la silueta debe seguir a la vista.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [state.systemId])

  return (
    <aside className="detail-panel" aria-labelledby="detail-panel-title">
      <div className="detail-panel__header">
        <div>
          <h2 id="detail-panel-title" ref={headingRef} tabIndex={-1}>
            {system.name}
          </h2>
          <p className="detail-panel__structures">{system.structures}</p>
        </div>
        <button type="button" className="detail-panel__close" onClick={onClose} aria-label="Cerrar panel">
          ×
        </button>
      </div>

      <p className={`detail-panel__level level-text level-text--${state.level}`}>
        Nivel: <strong>{LEVEL_LABELS[state.level]}</strong>
      </p>

      <p className="detail-panel__context">
        Se muestra solo lo registrado en esta atención: {ENCOUNTER_KIND_LABELS[encounter.kind]} · {formatDate(encounter.start)}
        {encounter.organizationName && ` · ${encounter.organizationName}`}
      </p>

      {state.evidence.length === 0 ? (
        <p className="detail-panel__empty">No hay diagnósticos asociados a este sistema en esta atención.</p>
      ) : (
        <ul className="detail-panel__list" aria-label="Diagnósticos del sistema">
          {state.evidence.map((evidence) => (
            <DiagnosisItem key={evidence.diagnosis.conditionId} evidence={evidence} isCause={evidence === state.cause} />
          ))}
        </ul>
      )}
    </aside>
  )
}
