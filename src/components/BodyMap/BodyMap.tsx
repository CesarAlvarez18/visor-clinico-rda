import { useCallback, useId, useRef, useState } from 'react'
import { BODY_SYSTEMS, type BodySystemId } from '../../rules/config/bodySystems'
import type { BodyState } from '../../rules/types'
import { Legend } from './Legend'
import { SystemChip } from './SystemChip'
import { SystemRegion } from './SystemRegion'
import { SystemTooltip, type TooltipPosition } from './SystemTooltip'
import { ANATOMY_LINES, BODY_OUTLINE, REGION_SHAPES, VIEW_BOX } from './bodyRegions'
import { GLOW_FILTER_ID, NO_DATA_PATTERN_ID } from './levelStyles'
import './BodyMap.css'

interface BodyMapProps {
  bodyState: BodyState
  selectedSystemId?: BodySystemId
  onSelect: (systemId: BodySystemId) => void
}

const CHIP_SYSTEMS = BODY_SYSTEMS.filter((s) => s.display === 'chip')

export function BodyMap({ bodyState, selectedSystemId, onSelect }: BodyMapProps) {
  const tooltipId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<{ systemId: BodySystemId; position: TooltipPosition } | undefined>()

  const handleHover = useCallback((systemId: BodySystemId, target: Element | null) => {
    if (!target || !containerRef.current) {
      setHovered(undefined)
      return
    }
    const box = target.getBoundingClientRect()
    const container = containerRef.current.getBoundingClientRect()
    setHovered({
      systemId,
      position: { left: box.left - container.left + box.width / 2, top: box.top - container.top - 8 },
    })
  }, [])

  return (
    <div className="body-map" ref={containerRef}>
      <svg
        className="body-map__svg"
        viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
        role="group"
        aria-label="Silueta del cuerpo con el nivel de afectación de cada sistema"
      >
        <defs>
          <pattern id={NO_DATA_PATTERN_ID} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(79, 214, 255, 0.07)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(79, 214, 255, 0.35)" strokeWidth="1.5" />
          </pattern>
          <filter id={GLOW_FILTER_ID} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="body-map-bg" cx="50%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#0f5468" />
            <stop offset="100%" stopColor="#041c26" />
          </radialGradient>
        </defs>
        <rect width={VIEW_BOX.width} height={VIEW_BOX.height} fill="url(#body-map-bg)" rx="12" />
        <g className="body-map__outline" filter={`url(#${GLOW_FILTER_ID})`} aria-hidden="true">
          <path d={BODY_OUTLINE} />
        </g>
        <g className="body-map__anatomy" aria-hidden="true">
          {ANATOMY_LINES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {REGION_SHAPES.map((shape) => (
          <SystemRegion
            key={shape.systemId}
            shape={shape}
            state={bodyState.systems[shape.systemId]}
            selected={selectedSystemId === shape.systemId}
            tooltipId={tooltipId}
            onSelect={() => onSelect(shape.systemId)}
            onHover={(target) => handleHover(shape.systemId, target)}
          />
        ))}
      </svg>

      <div className="body-map__chips" role="group" aria-label="Sistemas sin región en la silueta">
        {CHIP_SYSTEMS.map((system) => (
          <SystemChip
            key={system.id}
            state={bodyState.systems[system.id]}
            selected={selectedSystemId === system.id}
            tooltipId={tooltipId}
            onSelect={() => onSelect(system.id)}
            onHover={(target) => handleHover(system.id, target)}
          />
        ))}
      </div>

      <Legend />

      <SystemTooltip id={tooltipId} state={hovered ? bodyState.systems[hovered.systemId] : undefined} position={hovered?.position} />
    </div>
  )
}
