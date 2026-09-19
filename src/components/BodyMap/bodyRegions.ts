import type { BodySystemId } from '../../rules/config/bodySystems'
import { joinPaths, mirrorPath, symmetricPath, type Cubic } from './svgPath'

// Geometría de la silueta frontal, con el eje de simetría en x = 150. El lado
// izquierdo del espectador se dibuja a mano y el derecho se genera en espejo.
// El "lado derecho" del paciente queda a la izquierda del espectador: por eso
// el hígado está en x < 150 y el corazón se inclina hacia x > 150.
//
// Canon de 8 cabezas con cabeza de 78 px (H). Alturas desde y = 8:
//   1H barbilla (86) · 2H pezones (164) · 3H ombligo (242) · 4H entrepierna y
//   muñecas (320) · 4,7H punta de los dedos (378) · 6H rodillas (476) ·
//   7,5H tobillos (593) · 8H planta (632).
// Anchos: cabeza 0,9H (68), hombros 2,2H (172), tórax en la axila 1,6H (120),
// cintura 1,3H (100), caderas 1,6H (124).

/** El lienzo deja 50 px de margen a cada lado del cuerpo para los rótulos. */
export const VIEW_BOX = { x: -50, y: 0, width: 400, height: 640 }

/** Posición x de los rótulos en cada margen. */
export const LABEL_X = { left: 26, right: 274 }

// --- Contorno del cuerpo ------------------------------------------------

const LEFT_SIDE: Cubic[] = [
  // cráneo y sien
  { c1: [128, 8], c2: [116, 24], to: [116, 48] },
  // mejilla, mandíbula y mentón
  { c1: [116, 68], c2: [126, 84], to: [136, 88] },
  // cuello
  { c1: [137, 96], c2: [137, 104], to: [136, 112] },
  // trapecio hasta el hombro
  { c1: [118, 116], c2: [90, 122], to: [74, 132] },
  // deltoides
  { c1: [64, 138], c2: [62, 152], to: [64, 170] },
  // brazo hasta el codo (a la altura del ombligo)
  { c1: [62, 196], c2: [58, 226], to: [54, 252] },
  // antebrazo hasta la muñeca (a la altura de la entrepierna)
  { c1: [50, 278], c2: [46, 300], to: [44, 322] },
  // mano hasta la punta de los dedos (mitad del muslo)
  { c1: [42, 340], c2: [40, 362], to: [40, 378] },
  // dedos
  { c1: [42, 386], c2: [56, 386], to: [60, 376] },
  // cara interna de la mano
  { c1: [62, 360], c2: [62, 340], to: [62, 324] },
  // cara interna del antebrazo
  { c1: [66, 300], c2: [74, 276], to: [80, 254] },
  // cara interna del brazo hasta la axila
  { c1: [84, 230], c2: [88, 196], to: [90, 172] },
  // costado del tórax hasta la cintura
  { c1: [92, 200], c2: [98, 232], to: [100, 252] },
  // cintura y cadera
  { c1: [102, 272], c2: [90, 288], to: [88, 306] },
  // muslo hasta la rodilla
  { c1: [88, 350], c2: [104, 430], to: [110, 476] },
  // pantorrilla hasta el tobillo
  { c1: [112, 500], c2: [124, 540], to: [120, 593] },
  // talón
  { c1: [119, 604], c2: [114, 614], to: [112, 622] },
  // dedos del pie y cara interna del pie
  { c1: [116, 632], c2: [138, 634], to: [142, 624] },
  // tobillo interno
  { c1: [142, 612], c2: [140, 600], to: [140, 593] },
  // pantorrilla y rodilla internas
  { c1: [138, 560], c2: [132, 520], to: [136, 476] },
  // muslo interno hasta la entrepierna
  { c1: [140, 430], c2: [146, 350], to: [150, 320] },
]

/** Cabeza, tronco y extremidades en un solo trazo cerrado. */
export const BODY_OUTLINE = symmetricPath([150, 8], LEFT_SIDE)

// --- Líneas decorativas (radiografía) -----------------------------------

const LEFT_ANATOMY: string[] = [
  // clavícula
  'M150 124 C132 118 108 122 84 134',
  // costillas: del esternón hacia el costado
  ...[140, 153, 166, 179, 192, 205].map((y) => `M150 ${y} C132 ${y - 4} 106 ${y + 4} 100 ${y + 20}`),
  // costillas flotantes
  'M150 218 C136 216 118 224 112 236',
  // cresta ilíaca y ala de la pelvis
  'M92 262 C94 284 112 296 132 306 C140 310 146 314 150 320',
  'M104 300 C108 292 120 292 124 300',
  // esternocleidomastoideo
  'M138 90 C140 98 144 104 148 110',
  // pliegues del cerebro
  'M132 34 C138 28 144 32 146 38',
  'M126 48 C132 44 138 48 140 54',
  // asas intestinales
  'M114 280 C130 272 146 288 162 280 C176 272 186 278 186 284',
  'M114 292 C130 284 146 300 162 292 C176 284 186 290 186 296',
]

/** Columna, esternón, clavículas, costillas, pelvis y pliegues. No son interactivas. */
export const ANATOMY_LINES: string[] = [
  'M150 112 L150 320',
  'M150 22 L150 64',
  'M138 276 C142 284 158 284 162 276',
  ...LEFT_ANATOMY,
  ...LEFT_ANATOMY.map((d) => mirrorPath(d)),
]

const LEFT_VESSELS: string[] = [
  // carótida
  'M150 128 C146 118 144 104 142 90',
  // subclavia, braquial y radial hasta la mano
  'M150 136 C122 138 100 148 88 170 C76 204 64 250 56 300 C52 320 48 340 44 360',
  'M56 300 C54 320 50 338 46 356',
  // ramas coronarias y torácicas
  'M150 168 C136 172 122 186 114 204',
  // ilíaca y femoral hasta el pie
  'M150 300 C136 320 122 360 118 420 C116 470 120 540 122 600',
  'M150 300 C146 340 138 390 138 440',
]

/**
 * Árbol vascular: aorta, carótidas, arterias de brazos y piernas. Se pinta
 * con el color del nivel del sistema cardiovascular.
 */
export const VESSEL_LINES: string[] = [
  'M150 166 L150 128',
  'M152 222 L150 300',
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
  'M140 138 C124 134 106 146 102 166 C96 192 98 218 104 236 C110 246 130 248 140 238 C144 214 144 176 140 138 Z'
// El pulmón izquierdo del paciente (derecha del espectador) tiene la escotadura cardíaca.
const RIGHT_LUNG =
  'M160 138 C176 134 194 146 198 166 C204 192 202 218 196 236 C190 246 170 248 162 238 C158 222 166 208 176 198 C168 186 160 174 160 138 Z'

const LEFT_KIDNEY = 'M112 268 C100 268 96 282 98 294 C100 304 110 308 116 304 C112 296 112 284 116 274 C115 270 114 268 112 268 Z'

const LEFT_ARM = 'M68 178 C64 204 58 228 56 252 C52 278 48 300 46 320 L62 322 C66 300 74 276 80 254 C84 230 88 200 90 178 Z'
const LEFT_LEG =
  'M94 328 C92 370 104 430 110 476 C112 500 124 540 120 593 L140 593 C138 560 132 520 136 476 C140 430 146 350 148 328 Z'

export const REGION_SHAPES: RegionShape[] = [
  {
    systemId: 'nervous',
    d: 'M150 18 C132 18 122 32 122 44 C122 56 132 66 150 66 C168 66 178 56 178 44 C178 32 168 18 150 18 Z',
    label: { side: 'right', y: 42, to: [178, 42] },
  },
  {
    systemId: 'endocrine',
    // tiroides en forma de mariposa
    d: 'M140 100 C144 96 148 100 150 105 C152 100 156 96 160 100 C162 106 158 112 154 112 C152 110 148 110 146 112 C142 112 138 106 140 100 Z',
    label: { side: 'right', y: 106, to: [162, 106] },
  },
  {
    systemId: 'respiratory',
    d: joinPaths(LEFT_LUNG, RIGHT_LUNG),
    label: { side: 'left', y: 170, to: [102, 170] },
  },
  {
    systemId: 'cardiovascular',
    // corazón inclinado con el ápex hacia la izquierda del paciente
    d: 'M150 168 C140 158 122 166 126 184 C130 200 148 212 160 224 C174 212 190 196 186 180 C182 166 162 158 150 168 Z',
    label: { side: 'right', y: 190, to: [187, 186] },
  },
  {
    systemId: 'hepatic',
    // hígado en cuña bajo el pulmón derecho del paciente
    d: 'M98 244 C106 232 132 232 156 238 C162 242 160 254 152 260 C132 270 108 268 98 260 C94 254 94 250 98 244 Z',
    label: { side: 'left', y: 250, to: [98, 250] },
  },
  {
    systemId: 'digestive',
    // estómago y marco intestinal
    d: joinPaths(
      'M158 236 C172 230 194 238 194 254 C194 268 176 274 164 268 C158 264 156 258 158 252 C156 246 158 240 158 236 Z',
      'M114 274 C112 266 122 264 130 266 L170 266 C178 264 188 266 186 274 L188 290 C188 298 178 300 166 298 L134 298 C122 300 112 298 112 290 Z',
    ),
    label: { side: 'right', y: 254, to: [194, 252] },
  },
  {
    systemId: 'renal',
    // riñones en forma de frijol y vejiga
    d: joinPaths(
      LEFT_KIDNEY,
      mirrorPath(LEFT_KIDNEY),
      'M150 296 C138 296 134 302 138 308 C142 314 158 314 162 308 C166 302 162 296 150 296 Z',
    ),
    label: { side: 'left', y: 288, to: [98, 288] },
  },
  {
    systemId: 'reproductive',
    d: 'M136 312 C142 308 158 308 164 312 C166 320 158 330 150 332 C142 330 134 320 136 312 Z',
    label: { side: 'right', y: 318, to: [164, 316] },
  },
  {
    systemId: 'musculoskeletal',
    d: joinPaths(LEFT_ARM, mirrorPath(LEFT_ARM), LEFT_LEG, mirrorPath(LEFT_LEG)),
    label: { side: 'left', y: 470, to: [110, 470] },
  },
]
