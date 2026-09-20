import { useCallback, useId, useRef, useState } from 'react'
import { BODY_SYSTEMS, type BodySystemId } from '../../rules/config/bodySystems'
import type { SystemLevel } from '../../rules/levels'
import type { BodyState } from '../../rules/types'
import { Legend } from './Legend'
import { SystemChip } from './SystemChip'
import { SystemRegion } from './SystemRegion'
import { SystemTooltip, type TooltipPosition } from './SystemTooltip'
import { BoneStrokes } from './BoneStrokes'
import {
  ANATOMY_LINES,
  BACK_BONES,
  BACK_BONE_SHAPES,
  BODY_OUTLINE,
  FRONT_BONES,
  FRONT_BONE_SHAPES,
  NERVE_LINES,
  REGION_SHAPES,
  SKULL,
  SURFACE_LINES,
  VESSEL_LINES,
  VIEW_BOX,
} from './bodyRegions'
import { BONE_FILL_ID, GLOW_FILTER_ID, LEVEL_STYLES, NO_DATA_PATTERN_ID, ORGAN_SHEEN_ID, RIM_FILTER_ID, TREE_NO_DATA } from './levelStyles'
import './BodyMap.css'

interface BodyMapProps {
  bodyState: BodyState
  selectedSystemId?: BodySystemId
  onSelect: (systemId: BodySystemId) => void
}

// Vasos y nervios toman el color del nivel de su sistema; sin datos van en un
// tono neutro que no pertenece a la escala de niveles.
function treeColor(level: SystemLevel, tree: keyof typeof TREE_NO_DATA): string {
  return level === 'no-data' ? TREE_NO_DATA[tree] : LEVEL_STYLES[level].stroke
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
        viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
        role="group"
        aria-label="Silueta del cuerpo con el nivel de afectación de cada sistema"
      >
        <defs>
          <pattern id={NO_DATA_PATTERN_ID} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(150, 205, 255, 0.1)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(170, 215, 255, 0.4)" strokeWidth="1.5" />
          </pattern>
          <filter id={GLOW_FILTER_ID} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Borde tipo Fresnel: la luz se acumula hacia el contorno y el centro
              del cuerpo queda translúcido. Devuelve solo el halo interior. */}
          <filter id={RIM_FILTER_ID} x="-10%" y="-5%" width="120%" height="110%" colorInterpolationFilters="sRGB">
            <feComponentTransfer in="SourceAlpha" result="outside">
              <feFuncA type="table" tableValues="1 0" />
            </feComponentTransfer>
            <feGaussianBlur in="outside" stdDeviation="9" result="wide" />
            <feGaussianBlur in="outside" stdDeviation="2.5" result="tight" />
            <feMerge result="halo">
              <feMergeNode in="wide" />
              <feMergeNode in="tight" />
            </feMerge>
            <feComposite in="halo" in2="SourceAlpha" operator="in" result="rim" />
            <feFlood floodColor="#8fc8ff" floodOpacity="0.9" />
            <feComposite in2="rim" operator="in" />
          </filter>
          <radialGradient id="body-map-bg" cx="50%" cy="38%" r="75%">
            <stop offset="0%" stopColor="#1a5fd0" />
            <stop offset="55%" stopColor="#0a2f8a" />
            <stop offset="100%" stopColor="#030d38" />
          </radialGradient>
          <radialGradient id="body-map-floor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(140, 200, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(140, 200, 255, 0)" />
          </radialGradient>
          <radialGradient id={ORGAN_SHEEN_ID} cx="36%" cy="28%" r="60%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
            <stop offset="45%" stopColor="rgba(255, 255, 255, 0.08)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.22)" />
          </radialGradient>
          {/* Carne translúcida: más densa hacia el centro del tronco. */}
          <radialGradient id="body-flesh" cx="50%" cy="38%" r="60%">
            <stop offset="0%" stopColor="rgba(40, 110, 230, 0.5)" />
            <stop offset="100%" stopColor="rgba(90, 165, 255, 0.22)" />
          </radialGradient>
          <linearGradient id={BONE_FILL_ID} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff6dc" />
            <stop offset="100%" stopColor="#bfa97a" />
          </linearGradient>
          <linearGradient id="body-map-scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(160, 235, 255, 0)" />
            <stop offset="50%" stopColor="rgba(160, 235, 255, 0.28)" />
            <stop offset="100%" stopColor="rgba(160, 235, 255, 0)" />
          </linearGradient>
          <clipPath id="body-map-clip">
            <path d={BODY_OUTLINE} />
          </clipPath>
        </defs>
        <rect x={VIEW_BOX.x} y={VIEW_BOX.y} width={VIEW_BOX.width} height={VIEW_BOX.height} fill="url(#body-map-bg)" rx="12" />
        <ellipse cx="150" cy="630" rx="92" ry="9" fill="url(#body-map-floor)" aria-hidden="true" />
        <g aria-hidden="true">
          <path d={BODY_OUTLINE} fill="url(#body-flesh)" />
          <path d={BODY_OUTLINE} fill="#000" filter={`url(#${RIM_FILTER_ID})`} />
          <g className="body-map__outline" filter={`url(#${GLOW_FILTER_ID})`}>
            <path d={BODY_OUTLINE} fill="none" />
          </g>
        </g>
        <g className="body-map__surface" aria-hidden="true">
          {SURFACE_LINES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {/* Detrás de los órganos: columna y arco posterior de las costillas. */}
        <g className="body-map__bones body-map__bones--back" aria-hidden="true">
          {BACK_BONE_SHAPES.map((d) => (
            <path key={d} className="body-map__bone-shape" d={d} />
          ))}
          <BoneStrokes strokes={BACK_BONES} />
        </g>
        <g className="body-map__tree" stroke={treeColor(bodyState.systems.nervous.level, 'nerves')} aria-hidden="true">
          {NERVE_LINES.map((nerve) => (
            <path key={nerve.d} d={nerve.d} strokeWidth={nerve.width} />
          ))}
        </g>
        <g
          className="body-map__tree body-map__vessels"
          stroke={treeColor(bodyState.systems.cardiovascular.level, 'vessels')}
          filter={`url(#${GLOW_FILTER_ID})`}
          aria-hidden="true"
        >
          {VESSEL_LINES.map((vessel) => (
            <path key={vessel.d} d={vessel.d} strokeWidth={vessel.width} />
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
        {/* Delante de los órganos: cráneo, clavículas, costillas, esternón y pelvis. */}
        <g className="body-map__bones" aria-hidden="true">
          <path className="body-map__skull" d={SKULL.cranium} />
          {SKULL.hollows.map((d) => (
            <path key={d} className="body-map__skull-hollow" d={d} />
          ))}
          <path className="body-map__teeth" d={SKULL.teeth} />
          {FRONT_BONE_SHAPES.map((d) => (
            <path key={d} className="body-map__bone-shape body-map__bone-shape--front" d={d} />
          ))}
          <BoneStrokes strokes={FRONT_BONES} />
        </g>
        <g className="body-map__anatomy" aria-hidden="true">
          {ANATOMY_LINES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g clipPath="url(#body-map-clip)" aria-hidden="true">
          <rect className="body-map__scan" x="0" y="-60" width="300" height="60" fill="url(#body-map-scan)" />
        </g>
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
