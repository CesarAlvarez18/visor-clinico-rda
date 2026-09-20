import { Html, Line } from '@react-three/drei'
import type { Vector3 } from 'three'
import { getBodySystem, type BodySystemId } from '../../rules/config/bodySystems'
import type { BodyState } from '../../rules/types'
import { LEVEL_STYLES } from '../BodyMap/levelStyles'

interface SystemLabelsProps {
  bodyState: BodyState
  anchors: Map<BodySystemId, Vector3>
}

const LABEL_OFFSET = 0.18

/**
 * Rótulos de nivel en texto, uno por sistema con datos (CA-11): desplazados
 * al margen del cuerpo con una línea guía hacia el ancla del sistema, para no
 * tapar el órgano. Los sistemas "Sin datos" no llevan rótulo (la leyenda y la
 * lista de sistemas ya cubren ese caso).
 */
export function SystemLabels({ bodyState, anchors }: SystemLabelsProps) {
  return (
    <>
      {[...anchors.entries()].map(([systemId, anchor]) => {
        const state = bodyState.systems[systemId]
        if (!state || state.level === 'no-data') return null
        const style = LEVEL_STYLES[state.level]
        const side = anchor.x >= 0 ? 1 : -1
        const labelPosition: [number, number, number] = [anchor.x + side * LABEL_OFFSET, anchor.y, anchor.z]

        return (
          <group key={systemId}>
            <Line points={[anchor.toArray(), labelPosition]} color={style.stroke} lineWidth={1} transparent opacity={0.55} />
            {/* sin `occlude`: el rótulo sigue legible aunque quede detrás de otra estructura al rotar. */}
            <Html position={labelPosition} center distanceFactor={2.4} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
              <div
                className="anatomy-label"
                style={{ background: style.badgeFill, color: style.badgeText, borderColor: style.stroke }}
              >
                <strong>{style.short}</strong>
                <span>{getBodySystem(systemId).name}</span>
              </div>
            </Html>
          </group>
        )
      })}
    </>
  )
}
