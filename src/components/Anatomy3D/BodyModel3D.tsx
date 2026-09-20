import { Suspense, useCallback, useEffect, useId, useRef, useState } from 'react'
import { BODY_SYSTEMS, type BodySystemId } from '../../rules/config/bodySystems'
import type { BodyState } from '../../rules/types'
import '../BodyMap/BodyMap.css'
import { Legend } from '../BodyMap/Legend'
import { SystemChip } from '../BodyMap/SystemChip'
import { SystemTooltip, type TooltipPosition } from '../BodyMap/SystemTooltip'
import { AnatomyScene, MODEL_URL } from './AnatomyScene'
import './BodyModel3D.css'
import { ModelErrorBoundary } from './ModelErrorBoundary'
import { SystemList } from './SystemList'
import { isWebglSupported } from './webglSupport'

interface BodyModel3DProps {
  bodyState: BodyState
  selectedSystemId?: BodySystemId
  onSelect: (systemId: BodySystemId) => void
  /** El equipo no puede mostrar 3D o el modelo no cargó: el visor vuelve a 2D (CA-5). */
  onUnavailable: () => void
}

type ModelSource = 'checking' | 'model' | 'procedural'

// El servidor de Vite responde index.html para rutas que no existen, así que
// además del estado se revisa que la respuesta no sea HTML.
function useModelSource(): ModelSource {
  const [status, setStatus] = useState<ModelSource>('checking')
  useEffect(() => {
    let cancelled = false
    fetch(MODEL_URL, { method: 'HEAD' })
      .then((response) => response.ok && !response.headers.get('content-type')?.includes('text/html'))
      .catch(() => false)
      .then((found) => {
        if (!cancelled) setStatus(found ? 'model' : 'procedural')
      })
    return () => {
      cancelled = true
    }
  }, [])
  return status
}

const CHIP_SYSTEMS = BODY_SYSTEMS.filter((s) => s.display === 'chip')

export function BodyModel3D({ bodyState, selectedSystemId, onSelect, onUnavailable }: BodyModel3DProps) {
  const tooltipId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlightedId, setHighlightedId] = useState<BodySystemId>()
  const [tooltip, setTooltip] = useState<{ systemId: BodySystemId; position: TooltipPosition } | undefined>()
  const [resetSignal, setResetSignal] = useState(0)
  const modelSource = useModelSource()
  const supported = useRef(isWebglSupported())

  useEffect(() => {
    if (!supported.current) onUnavailable()
    // Solo al montar: el soporte de WebGL no cambia durante la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleModelHover = useCallback((systemId: BodySystemId | undefined, clientX?: number, clientY?: number) => {
    setHighlightedId(systemId)
    if (systemId === undefined || clientX === undefined || clientY === undefined || !containerRef.current) {
      setTooltip(undefined)
      return
    }
    const container = containerRef.current.getBoundingClientRect()
    setTooltip({ systemId, position: { left: clientX - container.left, top: clientY - container.top - 16 } })
  }, [])

  const handleChipHover = useCallback((systemId: BodySystemId, target: Element | null) => {
    setHighlightedId(target ? systemId : undefined)
    if (!target || !containerRef.current) {
      setTooltip(undefined)
      return
    }
    const box = target.getBoundingClientRect()
    const container = containerRef.current.getBoundingClientRect()
    setTooltip({ systemId, position: { left: box.left - container.left + box.width / 2, top: box.top - container.top - 8 } })
  }, [])

  const handleListHighlight = useCallback((systemId: BodySystemId | undefined) => {
    setHighlightedId(systemId)
    setTooltip(undefined)
  }, [])

  if (!supported.current) return null

  return (
    <div className="body-model3d" ref={containerRef}>
      <div className="body-model3d__stage">
        {/* El lienzo es decorativo para el lector de pantalla: SystemList es la alternativa textual (CA-19, CA-20). */}
        <div className="body-model3d__canvas" aria-hidden="true">
          <ModelErrorBoundary onError={onUnavailable}>
            <Suspense fallback={<p className="body-model3d__loading">Cargando modelo anatómico…</p>}>
              {modelSource !== 'checking' && (
                <AnatomyScene
                  source={modelSource}
                  bodyState={bodyState}
                  highlightedId={highlightedId}
                  selectedId={selectedSystemId}
                  onHover={handleModelHover}
                  onSelect={onSelect}
                  resetSignal={resetSignal}
                />
              )}
            </Suspense>
          </ModelErrorBoundary>
        </div>
        <button type="button" className="button-secondary body-model3d__reset" onClick={() => setResetSignal((n) => n + 1)}>
          Vista frontal
        </button>
      </div>

      <SystemList bodyState={bodyState} selectedSystemId={selectedSystemId} onHighlight={handleListHighlight} onSelect={onSelect} />

      <div className="body-map__chips" role="group" aria-label="Sistemas sin región en el modelo">
        {CHIP_SYSTEMS.map((system) => (
          <SystemChip
            key={system.id}
            state={bodyState.systems[system.id]}
            selected={selectedSystemId === system.id}
            tooltipId={tooltipId}
            onSelect={() => onSelect(system.id)}
            onHover={(target) => handleChipHover(system.id, target)}
          />
        ))}
      </div>

      <Legend />

      <SystemTooltip id={tooltipId} state={tooltip ? bodyState.systems[tooltip.systemId] : undefined} position={tooltip?.position} />

      <p className="body-model3d__attribution">
        Modelo anatómico genérico · BodyParts3D (CC BY 4.0)
        {modelSource === 'procedural' && (
          <> · marcador de posición: guarda el modelo real en <code>public{MODEL_URL}</code></>
        )}
      </p>
    </div>
  )
}
