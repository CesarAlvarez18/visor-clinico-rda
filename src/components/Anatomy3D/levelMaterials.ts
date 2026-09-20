import { Color, MeshPhysicalMaterial, type Material } from 'three'
import type { BodySystemId } from '../../rules/config/bodySystems'
import type { SystemLevel } from '../../rules/levels'
import type { BodyState } from '../../rules/types'
import { BONE_COLOR, LEVEL_STYLES, TREE_NO_DATA } from '../BodyMap/levelStyles'
import { MODEL_SYSTEM_IDS, type MeshClassification } from './classifyMesh'
import { createFresnelMaterial } from './fresnelMaterial'

export interface SystemAppearance {
  color: string
  emissiveIntensity: number
  opacity: number
}

/** Órganos "sin datos" sin árbol propio (no son ni vasos ni nervios ni hueso). */
const NEUTRAL_ORGAN_NO_DATA = '#3f6fb0'

const EMISSIVE_BY_LEVEL: Record<Exclude<SystemLevel, 'no-data'>, number> = {
  normal: 1.0,
  mild: 1.6,
  moderate: 2.2,
  severe: 3.0,
}
// Por debajo del umbral de Bloom, para que "Sin datos" no brille como un nivel.
const NO_DATA_EMISSIVE_INTENSITY = 0.35

const OPACITY_WITH_DATA = 0.92
const OPACITY_NO_DATA = 0.55

/**
 * Apariencia de un sistema según su nivel. "Sin datos" nunca devuelve un
 * color de la escala: vasos y nervios usan su tono neutro propio (para no
 * confundirse con rojo/amarillo fijos), los huesos largos quedan color
 * hueso, y el resto de órganos usa un azul neutro apagado.
 */
export function systemAppearance(systemId: BodySystemId, level: SystemLevel): SystemAppearance {
  if (level === 'no-data') {
    const color =
      systemId === 'cardiovascular' ? TREE_NO_DATA.vessels
      : systemId === 'nervous' ? TREE_NO_DATA.nerves
      : systemId === 'musculoskeletal' ? BONE_COLOR
      : NEUTRAL_ORGAN_NO_DATA
    return { color, emissiveIntensity: NO_DATA_EMISSIVE_INTENSITY, opacity: OPACITY_NO_DATA }
  }
  return { color: LEVEL_STYLES[level].badgeFill, emissiveIntensity: EMISSIVE_BY_LEVEL[level], opacity: OPACITY_WITH_DATA }
}

const HIGHLIGHT_MULTIPLIER = 1.5
const SELECTED_MULTIPLIER = 2

/** Material "gel": mucha transmisión y rugosidad, con emisión propia para que brille desde dentro. */
function createGelMaterial(color: string, emissiveIntensity: number, opacity: number): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: new Color(color).multiplyScalar(0.25),
    emissive: new Color(color),
    emissiveIntensity,
    transmission: 0.9,
    roughness: 0.75,
    thickness: 0.35,
    ior: 1.3,
    metalness: 0,
    transparent: true,
    opacity,
    // Sin escritura de profundidad: con varios órganos translúcidos
    // superpuestos (p. ej. riñones detrás de los intestinos), escribir el
    // buffer de profundidad tapa por completo lo que hay detrás en vez de
    // dejarlo transparentar.
    depthWrite: false,
  })
}

export interface ModelMaterials {
  /** Piel: contorno Fresnel translúcido. */
  skin: Material
  /** Resto del esqueleto (no clasificado en ningún sistema): color hueso, sin transmisión. */
  skeleton: MeshPhysicalMaterial
  /** Un material por sistema con estructura propia (`MODEL_SYSTEM_IDS`). */
  systems: Map<BodySystemId, MeshPhysicalMaterial>
  /** Material para una malla, según su clasificación. */
  forClassification(classification: MeshClassification): Material
  /** Actualiza color/emisión in-place (sin recrear materiales) al cambiar de atención o de resaltado/selección. */
  update(bodyState: BodyState, highlightedId?: BodySystemId, selectedId?: BodySystemId): void
  dispose(): void
}

export function createModelMaterials(): ModelMaterials {
  const skin = createFresnelMaterial({ color: '#5fb4ff', power: 2.8, intensity: 4.5, coreOpacity: 0.035, opacity: 0.85 })
  const skeleton = new MeshPhysicalMaterial({
    color: BONE_COLOR,
    emissive: new Color(BONE_COLOR),
    emissiveIntensity: 0.15,
    roughness: 0.6,
    metalness: 0,
    transmission: 0,
    // Semitranslúcido y sin escritura de profundidad: las costillas y el
    // cráneo no deben tapar por completo los órganos del tórax que hay
    // detrás.
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })
  const systems = new Map<BodySystemId, MeshPhysicalMaterial>(MODEL_SYSTEM_IDS.map((id) => [id, createGelMaterial(BONE_COLOR, 0, OPACITY_NO_DATA)]))

  return {
    skin,
    skeleton,
    systems,
    forClassification(classification) {
      if (classification.kind === 'skin') return skin
      if (classification.kind === 'skeleton') return skeleton
      return systems.get(classification.systemId) ?? skeleton
    },
    update(bodyState, highlightedId, selectedId) {
      for (const [systemId, material] of systems) {
        const state = bodyState.systems[systemId]
        const appearance = systemAppearance(systemId, state?.level ?? 'no-data')
        const multiplier = systemId === selectedId ? SELECTED_MULTIPLIER : systemId === highlightedId ? HIGHLIGHT_MULTIPLIER : 1
        const color = new Color(appearance.color)
        material.color.copy(color).multiplyScalar(0.25)
        material.emissive.copy(color)
        material.emissiveIntensity = appearance.emissiveIntensity * multiplier
        material.opacity = appearance.opacity
      }
    },
    dispose() {
      skin.dispose()
      skeleton.dispose()
      for (const material of systems.values()) material.dispose()
    },
  }
}
