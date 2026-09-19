import type { BodySystemId } from '../../rules/config/bodySystems'

// Geometría de la silueta frontal en un viewBox de 300 × 640. Formas
// esquemáticas: lo importante es que cada región sea reconocible y clicable.

export const VIEW_BOX = { width: 300, height: 640 }

/** Cabeza. */
export const HEAD_OUTLINE =
  'M150 12 C172 12 190 30 190 56 C190 82 172 100 150 100 C128 100 110 82 110 56 C110 30 128 12 150 12 Z'

/** Cuello, tronco, brazos y piernas (lado izquierdo del espectador y luego el derecho, en espejo). */
export const BODY_OUTLINE =
  'M136 112 ' +
  'C120 116 96 124 86 140 ' + // hombro
  'C74 160 74 210 68 258 ' + // brazo hasta el codo
  'C64 292 58 330 54 366 ' + // antebrazo hasta la muñeca
  'C52 380 66 384 70 372 ' + // mano
  'C78 340 86 300 94 258 ' + // cara interna del antebrazo
  'C98 236 100 210 102 190 ' + // cara interna del brazo hasta la axila
  'C102 240 100 290 104 330 ' + // costado hasta la cintura
  'C102 370 104 400 108 440 ' + // cadera y muslo
  'C106 500 110 560 112 610 ' + // pierna hasta el tobillo
  'C112 622 118 628 128 626 ' + // pie
  'L138 626 ' +
  'C140 580 140 520 138 470 ' + // cara interna de la pierna
  'C140 450 146 436 150 428 ' + // entrepierna
  'C154 436 160 450 162 470 ' +
  'C160 520 160 580 162 626 ' +
  'L172 626 ' +
  'C182 628 188 622 188 610 ' +
  'C190 560 194 500 192 440 ' +
  'C196 400 198 370 196 330 ' +
  'C200 290 198 240 198 190 ' +
  'C200 210 202 236 206 258 ' +
  'C214 300 222 340 230 372 ' +
  'C234 384 248 380 246 366 ' +
  'C242 330 236 292 232 258 ' +
  'C226 210 226 160 214 140 ' +
  'C204 124 180 116 164 112 Z'

/**
 * Líneas decorativas (columna, clavículas, costillas, pelvis y grandes
 * vasos) para el aspecto de radiografía. No son interactivas.
 */
export const ANATOMY_LINES: string[] = [
  // columna
  'M150 112 L150 424',
  // clavículas
  'M150 122 C132 116 112 120 94 134',
  'M150 122 C168 116 188 120 206 134',
  // costillas
  ...[150, 168, 186, 204, 222].flatMap((y) => [
    `M150 ${y} C132 ${y} 110 ${y + 8} 102 ${y + 22}`,
    `M150 ${y} C168 ${y} 190 ${y + 8} 198 ${y + 22}`,
  ]),
  // pelvis
  'M104 346 C110 378 130 396 150 400 C170 396 190 378 196 346',
  // vasos principales
  'M150 212 L150 340',
  'M150 340 C140 380 126 420 120 470 L116 600',
  'M150 340 C160 380 174 420 180 470 L184 600',
  'M122 146 C102 186 90 250 74 332',
  'M178 146 C198 186 210 250 226 332',
]

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
      'M88 148 C80 176 76 220 70 262 L60 330 C66 338 76 336 80 326 L92 262 C96 236 98 210 100 186 Z ' +
      // brazo derecho del espectador
      'M212 148 C220 176 224 220 230 262 L240 330 C234 338 224 336 220 326 L208 262 C204 236 202 210 200 186 Z ' +
      // piernas
      'M110 442 C108 500 112 560 116 608 L134 608 C136 560 136 520 136 472 C134 458 126 448 110 442 Z ' +
      'M190 442 C192 500 188 560 184 608 L166 608 C164 560 164 520 164 472 C166 458 174 448 190 442 Z',
    label: { x: 150, y: 540, anchor: 'middle' },
  },
]
