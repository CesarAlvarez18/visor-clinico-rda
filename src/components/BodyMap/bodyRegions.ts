import type { BodySystemId } from '../../rules/config/bodySystems'
import { joinPaths, mirrorPath, symmetricPath, type Cubic } from './svgPath'

// Geometría de la silueta frontal en un viewBox de 300 × 640, con el eje de
// simetría en x = 150. El lado izquierdo del espectador se dibuja a mano y el
// derecho se genera en espejo. El "lado derecho" del paciente queda a la
// izquierda del espectador: por eso el hígado está en x < 150 y el corazón
// se inclina hacia x > 150.
//
// Proporciones (aprox. 7,5 cabezas): cabeza 88 px, hombros 2,3 cabezas de
// ancho, brazos ligeramente separados del tronco con las manos abiertas a la
// altura de los muslos.

/** El lienzo deja 50 px de margen a cada lado del cuerpo para los rótulos. */
export const VIEW_BOX = { x: -50, y: 0, width: 400, height: 640 }

/** Posición x de los rótulos en cada margen. */
export const LABEL_X = { left: 26, right: 274 }

// --- Contorno del cuerpo ------------------------------------------------

const LEFT_SIDE: Cubic[] = [
  // cráneo y sien
  { c1: [128, 8], c2: [114, 26], to: [114, 52] },
  // mejilla, mandíbula y mentón
  { c1: [114, 74], c2: [124, 92], to: [134, 98] },
  // cuello
  { c1: [135, 106], c2: [135, 112], to: [134, 118] },
  // trapecio hasta el hombro
  { c1: [116, 122], c2: [86, 128], to: [70, 138] },
  // deltoides
  { c1: [58, 144], c2: [52, 158], to: [52, 176] },
  // brazo hasta el codo
  { c1: [50, 206], c2: [48, 240], to: [46, 272] },
  // antebrazo hasta la muñeca
  { c1: [42, 306], c2: [36, 340], to: [32, 370] },
  // mano hasta la punta de los dedos
  { c1: [28, 386], c2: [26, 408], to: [30, 424] },
  // dedos
  { c1: [34, 432], c2: [52, 432], to: [58, 420] },
  // cara interna de la mano
  { c1: [60, 404], c2: [58, 386], to: [56, 372] },
  // cara interna del antebrazo
  { c1: [62, 340], c2: [70, 306], to: [76, 276] },
  // cara interna del brazo hasta la axila
  { c1: [82, 244], c2: [88, 212], to: [92, 188] },
  // costado del tórax hasta la cintura
  { c1: [94, 224], c2: [102, 268], to: [108, 300] },
  // cintura y cadera
  { c1: [110, 326], c2: [100, 346], to: [100, 376] },
  // muslo hasta la rodilla
  { c1: [102, 420], c2: [110, 460], to: [114, 498] },
  // pantorrilla hasta el tobillo
  { c1: [116, 530], c2: [124, 560], to: [120, 596] },
  // talón
  { c1: [119, 608], c2: [114, 618], to: [112, 626] },
  // dedos del pie y cara interna del pie
  { c1: [116, 636], c2: [138, 638], to: [142, 628] },
  // tobillo interno
  { c1: [142, 616], c2: [140, 606], to: [140, 596] },
  // pantorrilla y rodilla internas
  { c1: [138, 560], c2: [134, 530], to: [138, 498] },
  // muslo interno hasta la entrepierna
  { c1: [140, 466], c2: [146, 444], to: [150, 432] },
]

/** Cabeza, tronco y extremidades en un solo trazo cerrado. */
export const BODY_OUTLINE = symmetricPath([150, 8], LEFT_SIDE)

// --- Líneas decorativas (radiografía) -----------------------------------

const LEFT_ANATOMY: string[] = [
  // clavícula
  'M150 132 C130 126 104 130 80 142',
  // costillas: del esternón hacia el costado
  ...[150, 164, 178, 192, 206, 220].map((y) => `M150 ${y} C130 ${y - 4} 102 ${y + 6} 96 ${y + 24}`),
  // costillas flotantes
  'M150 234 C134 232 116 240 110 254',
  // cresta ilíaca y ala de la pelvis
  'M102 356 C106 386 122 398 138 410 C144 414 148 420 150 428',
  'M112 404 C116 396 128 396 132 404',
  // esternocleidomastoideo
  'M138 100 C140 108 144 114 148 118',
  // pliegues del cerebro
  'M132 40 C138 34 144 38 146 44',
  'M126 56 C132 52 138 56 140 62',
  // asas intestinales
  'M114 322 C130 312 146 332 162 322 C176 312 186 320 186 326',
  'M114 346 C130 336 146 356 162 346 C176 336 186 344 186 350',
  'M114 370 C130 360 146 380 162 370 C176 360 186 368 186 374',
]

/** Columna, esternón, clavículas, costillas, pelvis y pliegues. No son interactivas. */
export const ANATOMY_LINES: string[] = [
  'M150 118 L150 430',
  'M150 26 L150 76',
  'M136 372 C142 380 158 380 164 372',
  ...LEFT_ANATOMY,
  ...LEFT_ANATOMY.map((d) => mirrorPath(d)),
]

const LEFT_VESSELS: string[] = [
  // carótida
  'M150 140 C146 128 144 110 142 98',
  // subclavia, braquial y radial hasta la mano
  'M150 150 C120 152 98 162 84 186 C70 222 60 282 52 350 C48 380 44 400 40 416',
  'M52 350 C52 372 48 392 44 412',
  // ramas coronarias y torácicas
  'M150 178 C136 182 122 198 112 218',
  // ilíaca y femoral hasta el pie
  'M150 356 C136 380 122 420 118 470 C116 520 120 570 122 610',
  'M150 356 C146 400 138 450 138 500',
]

/**
 * Árbol vascular: aorta, carótidas, arterias de brazos y piernas. Se pinta
 * con el color del nivel del sistema cardiovascular.
 */
export const VESSEL_LINES: string[] = [
  'M150 176 L150 140',
  'M152 236 L150 356',
  ...LEFT_VESSELS,
  ...LEFT_VESSELS.map((d) => mirrorPath(d)),
]

// --- Regiones por sistema -------------------------------------------------

export interface RegionShape {
  systemId: BodySystemId
  /** Un `path` en coordenadas del viewBox. */
  d: string
  /** Rótulo del nivel en el margen (`side`) y punto del órgano al que apunta la línea guía. */
  label: { side: 'left' | 'right'; y: number; to: [number, number] }
}

const LEFT_LUNG =
  'M140 150 C124 146 106 158 102 180 C96 210 98 244 104 266 C110 278 130 280 140 268 C144 240 144 200 140 150 Z'
// El pulmón izquierdo del paciente (derecha del espectador) tiene la escotadura cardíaca.
const RIGHT_LUNG =
  'M160 150 C176 146 194 158 198 180 C204 210 202 244 196 266 C190 278 170 280 162 268 C158 250 166 234 178 222 C168 208 160 190 160 150 Z'

const LEFT_KIDNEY = 'M118 286 C106 286 102 302 104 316 C106 328 116 332 122 328 C118 318 118 304 122 292 C121 288 120 286 118 286 Z'

const LEFT_ARM = 'M60 182 C56 210 50 240 48 272 C44 306 38 340 36 368 L56 370 C62 340 70 306 76 278 C82 246 88 214 90 192 Z'
const LEFT_LEG =
  'M104 390 C104 430 110 462 114 498 C116 530 124 560 120 596 L140 596 C138 560 134 530 138 498 C140 466 146 444 148 434 C132 428 112 410 104 390 Z'

export const REGION_SHAPES: RegionShape[] = [
  {
    systemId: 'nervous',
    d: 'M150 22 C130 22 118 38 118 52 C118 66 130 78 150 78 C170 78 182 66 182 52 C182 38 170 22 150 22 Z',
    label: { side: 'right', y: 50, to: [180, 50] },
  },
  {
    systemId: 'endocrine',
    // tiroides en forma de mariposa
    d: 'M138 114 C142 110 148 114 150 120 C152 114 158 110 162 114 C164 120 160 128 154 128 C152 126 148 126 146 128 C140 128 136 120 138 114 Z',
    label: { side: 'right', y: 120, to: [162, 120] },
  },
  {
    systemId: 'respiratory',
    d: joinPaths(LEFT_LUNG, RIGHT_LUNG),
    label: { side: 'left', y: 190, to: [102, 190] },
  },
  {
    systemId: 'cardiovascular',
    // corazón inclinado con el ápex hacia la izquierda del paciente
    d: 'M150 182 C138 170 120 180 124 200 C128 218 148 232 162 248 C176 234 192 216 188 198 C184 182 164 172 150 182 Z',
    label: { side: 'right', y: 210, to: [188, 206] },
  },
  {
    systemId: 'hepatic',
    // hígado en cuña bajo el pulmón derecho del paciente
    d: 'M98 274 C106 260 132 260 156 266 C162 270 160 284 152 290 C132 302 108 300 98 290 C94 284 94 280 98 274 Z',
    label: { side: 'left', y: 282, to: [98, 282] },
  },
  {
    systemId: 'digestive',
    // estómago y marco intestinal
    d: joinPaths(
      'M158 262 C172 256 194 264 194 282 C194 298 176 306 164 300 C158 296 156 288 158 280 C156 272 158 266 158 262 Z',
      'M114 308 C112 300 122 298 130 300 L170 300 C178 298 188 300 186 308 L188 388 C188 400 178 404 166 402 L134 402 C122 404 112 400 112 388 Z',
    ),
    label: { side: 'right', y: 300, to: [192, 292] },
  },
  {
    systemId: 'renal',
    // riñones en forma de frijol y vejiga
    d: joinPaths(
      LEFT_KIDNEY,
      mirrorPath(LEFT_KIDNEY),
      'M150 404 C138 404 134 412 138 420 C142 426 158 426 162 420 C166 412 162 404 150 404 Z',
    ),
    label: { side: 'left', y: 318, to: [104, 316] },
  },
  {
    systemId: 'reproductive',
    d: 'M134 430 C142 426 158 426 166 430 C168 440 160 454 150 456 C140 454 132 440 134 430 Z',
    label: { side: 'right', y: 440, to: [166, 440] },
  },
  {
    systemId: 'musculoskeletal',
    d: joinPaths(LEFT_ARM, mirrorPath(LEFT_ARM), LEFT_LEG, mirrorPath(LEFT_LEG)),
    label: { side: 'left', y: 520, to: [116, 520] },
  },
]
