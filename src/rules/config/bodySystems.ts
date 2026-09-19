// Los doce sistemas corporales de la silueta. `region` se dibuja como zona
// anatómica en el SVG; `chip` se muestra como etiqueta alrededor del cuerpo
// porque no tiene un órgano localizable.

export type BodySystemId =
  | 'cardiovascular'
  | 'respiratory'
  | 'nervous'
  | 'digestive'
  | 'hepatic'
  | 'renal'
  | 'endocrine'
  | 'hematologic'
  | 'musculoskeletal'
  | 'integumentary'
  | 'reproductive'
  | 'mental'

export interface BodySystem {
  id: BodySystemId
  name: string
  /** Órganos o estructuras que representa en la silueta, para la interfaz. */
  structures: string
  display: 'region' | 'chip'
}

export const BODY_SYSTEMS: readonly BodySystem[] = [
  { id: 'cardiovascular', name: 'Cardiovascular', structures: 'Corazón y vasos', display: 'region' },
  { id: 'respiratory', name: 'Respiratorio', structures: 'Pulmones y vías aéreas', display: 'region' },
  { id: 'nervous', name: 'Nervioso', structures: 'Cerebro y sistema nervioso', display: 'region' },
  { id: 'digestive', name: 'Digestivo', structures: 'Estómago e intestinos', display: 'region' },
  { id: 'hepatic', name: 'Hepático', structures: 'Hígado y vías biliares', display: 'region' },
  { id: 'renal', name: 'Renal / urinario', structures: 'Riñones y vejiga', display: 'region' },
  { id: 'endocrine', name: 'Endocrino / metabólico', structures: 'Tiroides, páncreas y metabolismo', display: 'region' },
  { id: 'musculoskeletal', name: 'Musculoesquelético', structures: 'Huesos, articulaciones y músculos', display: 'region' },
  { id: 'reproductive', name: 'Reproductor', structures: 'Órganos reproductores', display: 'region' },
  { id: 'integumentary', name: 'Tegumentario (piel)', structures: 'Piel y anexos', display: 'chip' },
  { id: 'hematologic', name: 'Hematológico / inmune', structures: 'Sangre y sistema inmune', display: 'chip' },
  { id: 'mental', name: 'Salud mental', structures: 'Trastornos mentales y del comportamiento', display: 'chip' },
]

export const BODY_SYSTEM_IDS: readonly BodySystemId[] = BODY_SYSTEMS.map((s) => s.id)

const byId = new Map(BODY_SYSTEMS.map((s) => [s.id, s]))

export function getBodySystem(id: BodySystemId): BodySystem {
  return byId.get(id)!
}
