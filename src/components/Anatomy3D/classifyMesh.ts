import { BODY_SYSTEMS, type BodySystemId } from '../../rules/config/bodySystems'

/**
 * Clasificación de una malla del modelo 3D: piel, esqueleto (sin sistema
 * asignado) o una estructura de un sistema corporal concreto. Solo los
 * sistemas con `display: 'region'` tienen estructura propia en el modelo.
 */
export type MeshClassification = { kind: 'skin' } | { kind: 'skeleton' } | { kind: 'system'; systemId: BodySystemId }

/** Los 9 sistemas con estructura propia en el modelo (los que se dibujan como región). */
export const MODEL_SYSTEM_IDS: readonly BodySystemId[] = BODY_SYSTEMS.filter((s) => s.display === 'region').map((s) => s.id)

interface NamedNode {
  name: string
  parent?: NamedNode | null
}

const BODY_SYSTEM_ID_SET = new Set<string>(BODY_SYSTEMS.map((s) => s.id))
function isBodySystemId(value: string): value is BodySystemId {
  return BODY_SYSTEM_ID_SET.has(value)
}

// Contrato exacto que debe traer el GLB: un nodo `system:<id>` por sistema con
// estructura (p. ej. `system:cardiovascular`).
const SYSTEM_TAG_PATTERN = /^system:([a-z]+)$/

// Respaldo por nombre, para poder usar la anatomía procedural y GLB de
// terceros mientras no se ajusten al contrato exacto de nombres.
const SYSTEM_KEYWORD_PATTERNS: [BodySystemId, RegExp][] = [
  ['cardiovascular', /heart|corazon|aorta|arter|vein|vena|vascul|blood|sangu/],
  ['respiratory', /lung|pulmon|trachea|traquea|bronch|bronquio/],
  ['nervous', /brain|cerebro|nerv|spinalcord|medulaespinal/],
  ['digestive', /stomach|estomago|intestin|colon|esophag|esofago/],
  ['hepatic', /liver|higado|gallbladder|vesicula/],
  ['renal', /kidney|rinon|ureter|bladder|vejiga/],
  ['endocrine', /thyroid|tiroides|pancrea|adrenal|suprarrenal/],
  ['musculoskeletal', /femur|tibia|fibula|humerus|humero|radius|radio|ulna|cubito/],
  ['reproductive', /uterus|utero|ovary|ovario|prostate|prostata|testis|testiculo/],
]

const SKELETON_PATTERN = /skelet|esquelet|bone|hueso|skull|craneo|rib|costilla|spine|columna|vertebra|pelvis/
const SKIN_PATTERN = /skin|piel|body|cuerpo|surface|superficie|silhouette|silueta/

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Clasificación de una malla del modelo 3D. Gana el nombre más cercano a la
 * malla: se recorre de la malla hacia la raíz y, en el primer nodo con
 * coincidencia, se prueba en orden `system:<id>` exacto, sistema por palabra
 * clave, esqueleto y piel. Sin ninguna coincidencia en toda la jerarquía, la
 * malla se trata como esqueleto (no clicable, sin sistema).
 */
export function classifyMesh(node: NamedNode): MeshClassification {
  for (let current: NamedNode | null | undefined = node; current; current = current.parent) {
    const name = normalize(current.name)

    const tagMatch = name.match(SYSTEM_TAG_PATTERN)
    if (tagMatch && isBodySystemId(tagMatch[1])) return { kind: 'system', systemId: tagMatch[1] }

    const keywordMatch = SYSTEM_KEYWORD_PATTERNS.find(([, pattern]) => pattern.test(name))
    if (keywordMatch) return { kind: 'system', systemId: keywordMatch[0] }

    if (SKELETON_PATTERN.test(name)) return { kind: 'skeleton' }
    if (SKIN_PATTERN.test(name)) return { kind: 'skin' }
  }
  return { kind: 'skeleton' }
}
