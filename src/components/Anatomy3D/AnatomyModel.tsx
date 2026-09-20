import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import type { Mesh, Object3D } from 'three'
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { BodySystemId } from '../../rules/config/bodySystems'
import type { BodyState } from '../../rules/types'
import { classifyMesh } from './classifyMesh'
import { createModelMaterials } from './levelMaterials'

// Un arrastre para rotar la cámara no cuenta como clic (CA-14).
const CLICK_MAX_DRAG_PX = 4

export interface AnatomyModelProps {
  /** Fuente ya normalizada (GLB real o anatomía procedural), sin clonar. */
  source: Object3D
  bodyState: BodyState
  highlightedId?: BodySystemId
  selectedId?: BodySystemId
  onHover?: (systemId: BodySystemId | undefined, clientX?: number, clientY?: number) => void
  onSelect?: (systemId: BodySystemId) => void
}

/**
 * Clona la fuente anatómica, asigna un material por sistema según su
 * clasificación y actualiza color/emisión cuando cambian `bodyState`, el
 * sistema resaltado o el seleccionado, sin reconstruir el clon.
 */
export function AnatomyModel({ source, bodyState, highlightedId, selectedId, onHover, onSelect }: AnatomyModelProps) {
  const materials = useMemo(() => createModelMaterials(), [])
  useEffect(() => () => materials.dispose(), [materials])

  // El clon comparte geometrías con la fuente; solo cambian los materiales.
  const object = useMemo(() => {
    const clone = cloneWithSkeleton(source)
    clone.traverse((node) => {
      const mesh = node as Mesh
      if (!mesh.isMesh) return
      const classification = classifyMesh(mesh)
      mesh.material = materials.forClassification(classification)
      // La piel y el esqueleto sin sistema no capturan al raycaster, para
      // poder apuntar a los órganos que hay debajo (Tarea 5).
      if (classification.kind !== 'system') mesh.raycast = () => {}
      if (classification.kind === 'skin') mesh.renderOrder = 1
    })
    return clone
  }, [source, materials])

  useEffect(() => {
    materials.update(bodyState, highlightedId, selectedId)
  }, [materials, bodyState, highlightedId, selectedId])

  // stopPropagation toma solo la malla más cercana bajo el cursor: como la
  // piel y el esqueleto no capturan el raycaster, esto es siempre un órgano.
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    const classification = classifyMesh(event.object as Mesh)
    if (classification.kind === 'system') onHover?.(classification.systemId, event.nativeEvent.clientX, event.nativeEvent.clientY)
  }
  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onHover?.(undefined)
  }
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta > CLICK_MAX_DRAG_PX) return
    const classification = classifyMesh(event.object as Mesh)
    if (classification.kind === 'system') onSelect?.(classification.systemId)
  }

  return <primitive object={object} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} onClick={handleClick} />
}
