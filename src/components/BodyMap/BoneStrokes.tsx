import type { RegionStroke } from './bodyRegions'
import { BONE_COLOR } from './levelStyles'

interface BoneStrokesProps {
  strokes: RegionStroke[]
  /** Color del hueso; por defecto, color hueso natural. */
  color?: string
}

/**
 * Huesos dibujados en dos pasadas: el trazo del color del hueso y, encima, un
 * brillo fino que les da volumen cilíndrico. El grosor va en `style` para que
 * no lo pise la regla CSS de hover de las regiones.
 */
export function BoneStrokes({ strokes, color = BONE_COLOR }: BoneStrokesProps) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g stroke={color}>
        {strokes.map((bone) => (
          <path key={bone.d} d={bone.d} style={{ strokeWidth: bone.width }} />
        ))}
      </g>
      <g stroke="#ffffff" strokeOpacity={0.55}>
        {strokes.map((bone) => (
          <path key={bone.d} d={bone.d} style={{ strokeWidth: bone.width * 0.32 }} />
        ))}
      </g>
    </g>
  )
}
