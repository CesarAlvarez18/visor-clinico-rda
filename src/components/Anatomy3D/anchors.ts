import { Box3, Vector3, type Mesh, type Object3D } from 'three'
import type { BodySystemId } from '../../rules/config/bodySystems'
import { classifyMesh } from './classifyMesh'

// Para sistemas que se extienden por todo el cuerpo (árbol vascular, nervios
// periféricos, huesos largos de las cuatro extremidades), el centro de todas
// sus mallas caería fuera del cuerpo; se usa en su lugar un punto
// representativo: corazón, cerebro y un fémur.
const REPRESENTATIVE_NAME: Partial<Record<BodySystemId, RegExp>> = {
  cardiovascular: /heart|corazon/,
  nervous: /brain|cerebro/,
  musculoskeletal: /femur/,
}

/**
 * Punto de anclaje de cada sistema con estructura en el modelo, en el mismo
 * espacio local que la fuente ya normalizada (`normalizeModel`), para anclar
 * sus rótulos de nivel.
 */
export function computeSystemAnchors(root: Object3D): Map<BodySystemId, Vector3> {
  root.updateMatrixWorld(true)

  const meshesBySystem = new Map<BodySystemId, Mesh[]>()
  root.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    const classification = classifyMesh(mesh)
    if (classification.kind !== 'system') return
    const list = meshesBySystem.get(classification.systemId) ?? []
    list.push(mesh)
    meshesBySystem.set(classification.systemId, list)
  })

  const anchors = new Map<BodySystemId, Vector3>()
  for (const [systemId, meshes] of meshesBySystem) {
    const pattern = REPRESENTATIVE_NAME[systemId]
    const representative = pattern ? meshes.find((mesh) => pattern.test(mesh.name.toLowerCase())) : undefined
    const target = representative ? [representative] : meshes
    const box = new Box3()
    for (const mesh of target) box.expandByObject(mesh)
    anchors.set(systemId, box.getCenter(new Vector3()))
  }
  return anchors
}
