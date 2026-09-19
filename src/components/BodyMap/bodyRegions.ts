import type { BodySystemId } from '../../rules/config/bodySystems'
import { joinPaths, mirrorPath, symmetricPath, type Cubic } from './svgPath'

// Geometría de la silueta frontal en un viewBox de 300 × 640, con el eje de
// simetría en x = 150. El lado izquierdo del espectador se dibuja a mano y el
// derecho se genera en espejo. El "lado derecho" del paciente queda a la
// izquierda del espectador: por eso el hígado está en x < 150 y el corazón
// se inclina hacia x > 150.

export const VIEW_BOX = { width: 300, height: 640 }

// --- Contorno del cuerpo ------------------------------------------------

const LEFT_SIDE: Cubic[] = [
  // cabeza: sien y mejilla
  { c1: [126, 10], c2: [111, 30], to: [111, 54] },
  // mejilla, mandíbula y mentón
  { c1: [111, 74], c2: [122, 92], to: [136, 100] },
  // cuello
  { c1: [137, 108], c2: [137, 116], to: [136, 124] },
  // trapecio hasta el hombro
  { c1: [120, 128], c2: [96, 134], to: [82, 144] },
  // deltoides
  { c1: [70, 150], c2: [64, 160], to: [64, 176] },
  // brazo hasta el codo
  { c1: [62, 202], c2: [60, 232], to: [58, 262] },
  // antebrazo hasta la muñeca
  { c1: [54, 290], c2: [50, 320], to: [46, 346] },
  // mano hasta la punta de los dedos
  { c1: [44, 360], c2: [40, 378], to: [40, 394] },
  // dedos
  { c1: [42, 402], c2: [54, 404], to: [58, 394] },
  // cara interna de la mano
  { c1: [60, 380], c2: [62, 364], to: [64, 350] },
  // cara interna del antebrazo
  { c1: [70, 322], c2: [76, 294], to: [80, 266] },
  // cara interna del brazo hasta la axila
  { c1: [86, 240], c2: [90, 214], to: [94, 190] },
  // costado y cintura
  { c1: [94, 224], c2: [100, 264], to: [104, 300] },
  // cadera
  { c1: [106, 330], c2: [96, 352], to: [98, 380] },
  // muslo hasta la rodilla
  { c1: [100, 420], c2: [106, 452], to: [112, 480] },
  // pantorrilla
  { c1: [114, 500], c2: [122, 530], to: [118, 560] },
  // tobillo
  { c1: [117, 580], c2: [118, 596], to: [118, 604] },
  // talón y empeine
  { c1: [116, 612], c2: [108, 622], to: [114, 628] },
  // dedos del pie y cara interna del pie
  { c1: [120, 634], c2: [134, 634], to: [140, 626] },
  // tobillo interno
  { c1: [140, 618], c2: [138, 610], to: [138, 604] },
  // pantorrilla y rodilla internas
  { c1: [136, 570], c2: [132, 540], to: [136, 480] },
  // muslo interno hasta la entrepierna
  { c1: [138, 450], c2: [144, 428], to: [150, 412] },
]

/** Cabeza, tronco y extremidades en un solo trazo cerrado. */
export const BODY_OUTLINE = symmetricPath([150, 10], LEFT_SIDE)

// --- Líneas decorativas (radiografía) -----------------------------------

const LEFT_ANATOMY: string[] = [
  // clavícula
  'M150 132 C134 128 112 132 92 146',
  // costillas
  ...[156, 172, 188, 204, 220, 236].map((y) => `M150 ${y} C136 ${y} 118 ${y + 6} 108 ${y + 20}`),
  // cresta ilíaca
  'M104 356 C112 376 128 392 150 398',
  // vasos del brazo y de la pierna
  'M110 150 C92 200 76 260 60 336',
  'M152 340 C142 372 128 410 124 470 L122 596',
  // pliegues del cerebro
  'M132 42 C138 36 144 40 146 46',
  'M126 58 C132 54 138 58 140 64',
  // asas intestinales
  'M114 316 C130 306 146 326 162 316 C176 306 186 314 186 320',
  'M114 340 C130 330 146 350 162 340 C176 330 186 338 186 344',
  'M114 364 C130 354 146 374 162 364 C176 354 186 362 186 368',
]

/** Columna, clavículas, costillas, pelvis, vasos y pliegues. No son interactivas. */
export const ANATOMY_LINES: string[] = [
  'M150 124 L150 400',
  'M150 28 L150 78',
  ...LEFT_ANATOMY,
  ...LEFT_ANATOMY.map((d) => mirrorPath(d)),
]

// --- Regiones por sistema -------------------------------------------------

export interface RegionShape {
  systemId: BodySystemId
  /** Un `path` en coordenadas del viewBox. */
  d: string
  /** Punto donde se ancla el rótulo del nivel. */
  label: { x: number; y: number; anchor?: 'start' | 'middle' | 'end' }
}

const LEFT_LUNG =
  'M136 152 C126 150 112 160 108 178 C104 202 104 232 110 254 C114 264 128 266 136 258 C139 240 140 200 136 152 Z'
// El pulmón izquierdo del paciente (derecha del espectador) tiene la escotadura cardíaca.
const RIGHT_LUNG =
  'M164 152 C174 150 188 160 192 178 C196 202 196 232 190 254 C186 264 172 266 164 258 C160 240 162 222 172 208 C166 198 160 182 164 152 Z'

const LEFT_KIDNEY = 'M118 274 C108 274 104 288 106 300 C108 310 116 314 122 310 C118 300 118 288 122 278 C121 275 120 274 118 274 Z'

const LEFT_ARM = 'M70 178 C66 206 62 236 60 262 C56 290 52 320 50 344 L62 348 C68 322 74 294 78 268 C84 242 88 216 92 194 Z'
const LEFT_LEG =
  'M102 394 C102 430 108 452 112 480 C114 500 120 530 118 560 C117 580 118 596 118 604 L138 604 C140 580 138 560 134 540 C132 520 134 500 136 480 C138 450 144 430 146 424 Z'

export const REGION_SHAPES: RegionShape[] = [
  {
    systemId: 'nervous',
    d: 'M150 26 C130 26 118 40 118 54 C118 68 130 80 150 80 C170 80 182 68 182 54 C182 40 170 26 150 26 Z',
    label: { x: 150, y: 20, anchor: 'middle' },
  },
  {
    systemId: 'endocrine',
    // tiroides en forma de mariposa
    d: 'M138 120 C142 116 148 120 150 126 C152 120 158 116 162 120 C164 126 160 134 154 134 C152 132 148 132 146 134 C140 134 136 126 138 120 Z',
    label: { x: 176, y: 126, anchor: 'start' },
  },
  {
    systemId: 'respiratory',
    d: joinPaths(LEFT_LUNG, RIGHT_LUNG),
    label: { x: 236, y: 160, anchor: 'start' },
  },
  {
    systemId: 'cardiovascular',
    // corazón inclinado con el ápex hacia la izquierda del paciente
    d: 'M150 178 C140 168 122 176 126 194 C130 210 148 224 160 236 C172 224 186 208 182 192 C178 178 162 170 150 178 Z',
    label: { x: 236, y: 208, anchor: 'start' },
  },
  {
    systemId: 'hepatic',
    // hígado en cuña bajo el pulmón derecho del paciente
    d: 'M96 262 C104 250 130 250 154 256 C160 260 158 272 150 278 C130 290 106 288 96 278 C92 272 92 268 96 262 Z',
    label: { x: 66, y: 268, anchor: 'end' },
  },
  {
    systemId: 'digestive',
    // estómago y marco intestinal
    d: joinPaths(
      'M156 254 C170 248 190 256 190 272 C190 288 172 296 160 290 C154 286 152 278 154 270 C152 262 154 258 156 254 Z',
      'M112 300 C110 292 120 290 128 292 L172 292 C180 290 190 292 188 300 L190 372 C190 384 180 388 168 386 L132 386 C120 388 110 384 110 372 Z',
    ),
    label: { x: 236, y: 300, anchor: 'start' },
  },
  {
    systemId: 'renal',
    // riñones en forma de frijol y vejiga
    d: joinPaths(
      LEFT_KIDNEY,
      mirrorPath(LEFT_KIDNEY),
      'M150 392 C138 392 134 400 138 408 C142 414 158 414 162 408 C166 400 162 392 150 392 Z',
    ),
    label: { x: 66, y: 296, anchor: 'end' },
  },
  {
    systemId: 'reproductive',
    d: 'M132 414 C140 410 160 410 168 414 C170 424 162 440 150 442 C138 440 130 424 132 414 Z',
    label: { x: 236, y: 428, anchor: 'start' },
  },
  {
    systemId: 'musculoskeletal',
    d: joinPaths(LEFT_ARM, mirrorPath(LEFT_ARM), LEFT_LEG, mirrorPath(LEFT_LEG)),
    label: { x: 150, y: 520, anchor: 'middle' },
  },
]
