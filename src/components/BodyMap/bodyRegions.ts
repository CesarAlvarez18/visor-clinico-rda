import type { BodySystemId } from '../../rules/config/bodySystems'

// Geometría de la silueta frontal en un viewBox de 300 × 640. Formas
// esquemáticas: lo importante es que cada región sea reconocible y clicable.

export const VIEW_BOX = { width: 300, height: 640 }

/** Contorno del cuerpo (cabeza, tronco, brazos y piernas). */
export const BODY_OUTLINE =
  // cabeza
  'M150 18 a40 44 0 1 0 0.01 0 Z ' +
  // cuello + tronco + piernas
  'M136 98 h28 v14 c30 4 52 14 60 30 l14 130 c-8 4 -14 4 -22 0 l-12 -90 v120 c4 60 4 110 -2 170 h-32 ' +
  'l-4 -100 l-16 -60 l-16 60 l-4 100 h-32 c-6 -60 -6 -110 -2 -170 v-120 l-12 90 c-8 4 -14 4 -22 0 ' +
  'l14 -130 c8 -16 30 -26 60 -30 Z'

export interface RegionShape {
  systemId: BodySystemId
  /** Un `path` en coordenadas del viewBox. */
  d: string
  /** Punto donde se ancla el rótulo del nivel. */
  label: { x: number; y: number; anchor?: 'start' | 'middle' | 'end' }
}

// Nota: el "lado derecho" del paciente queda a la izquierda del espectador,
// por eso el hígado está en x < 150.
export const REGION_SHAPES: RegionShape[] = [
  {
    systemId: 'nervous',
    d: 'M150 24 c-22 0 -34 16 -32 32 c2 14 14 22 32 22 c18 0 30 -8 32 -22 c2 -16 -10 -32 -32 -32 Z',
    label: { x: 150, y: 22, anchor: 'middle' },
  },
  {
    systemId: 'endocrine',
    d: 'M136 100 c0 -6 6 -8 14 -6 c8 -2 14 0 14 6 c0 8 -6 12 -14 10 c-8 2 -14 -2 -14 -10 Z',
    label: { x: 176, y: 108, anchor: 'start' },
  },
  {
    systemId: 'respiratory',
    d:
      'M118 128 c-18 4 -28 26 -28 48 c0 24 8 40 28 44 c10 2 18 -6 18 -16 v-64 c0 -10 -8 -14 -18 -12 Z ' +
      'M182 128 c18 4 28 26 28 48 c0 24 -8 40 -28 44 c-10 2 -18 -6 -18 -16 v-64 c0 -10 8 -14 18 -12 Z',
    label: { x: 234, y: 150, anchor: 'start' },
  },
  {
    systemId: 'cardiovascular',
    d: 'M152 168 c6 -12 26 -12 26 6 c0 14 -16 26 -26 36 c-10 -10 -26 -22 -26 -36 c0 -18 20 -18 26 -6 Z',
    label: { x: 234, y: 196, anchor: 'start' },
  },
  {
    systemId: 'hepatic',
    d: 'M92 226 c10 -12 40 -14 56 -8 c6 2 6 12 0 16 c-16 10 -40 14 -54 10 c-6 -2 -8 -12 -2 -18 Z',
    label: { x: 66, y: 232, anchor: 'end' },
  },
  {
    systemId: 'digestive',
    d:
      'M154 226 c14 -6 32 0 32 14 c0 12 -12 18 -24 16 c-8 -2 -12 -10 -8 -30 Z ' +
      'M118 268 h64 c8 0 10 6 10 12 v36 c0 6 -2 12 -10 12 h-64 c-8 0 -10 -6 -10 -12 v-36 c0 -6 2 -12 10 -12 Z',
    label: { x: 234, y: 296, anchor: 'start' },
  },
  {
    systemId: 'renal',
    d:
      'M104 252 c-8 0 -10 10 -8 20 c2 10 8 14 14 12 c6 -2 8 -10 6 -20 c-2 -8 -6 -12 -12 -12 Z ' +
      'M196 252 c8 0 10 10 8 20 c-2 10 -8 14 -14 12 c-6 -2 -8 -10 -6 -20 c2 -8 6 -12 12 -12 Z ' +
      'M150 332 c-12 0 -16 8 -14 16 c2 8 8 10 14 10 c6 0 12 -2 14 -10 c2 -8 -2 -16 -14 -16 Z',
    label: { x: 66, y: 268, anchor: 'end' },
  },
  {
    systemId: 'reproductive',
    d: 'M128 362 h44 c4 0 6 4 4 8 l-10 18 c-2 4 -6 6 -10 6 h-12 c-4 0 -8 -2 -10 -6 l-10 -18 c-2 -4 0 -8 4 -8 Z',
    label: { x: 234, y: 378, anchor: 'start' },
  },
  {
    systemId: 'musculoskeletal',
    d:
      // brazo izquierdo del espectador
      'M84 150 l-12 118 c-2 6 4 10 10 8 l16 -110 Z ' +
      // brazo derecho del espectador
      'M216 150 l12 118 c2 6 -4 10 -10 8 l-16 -110 Z ' +
      // piernas
      'M110 400 l-6 190 h28 l6 -160 l12 -30 Z M190 400 l6 190 h-28 l-6 -160 l-12 -30 Z',
    label: { x: 150, y: 540, anchor: 'middle' },
  },
]
