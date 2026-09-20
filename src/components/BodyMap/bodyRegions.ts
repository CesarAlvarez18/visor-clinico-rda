import type { BodySystemId } from '../../rules/config/bodySystems'
import { joinPaths, mirrorPath, symmetricPath, type Cubic } from './svgPath'

// Geometría de la silueta frontal, con el eje de simetría en x = 150. El lado
// izquierdo del espectador se dibuja a mano y el derecho se genera en espejo.
// El "lado derecho" del paciente queda a la izquierda del espectador: por eso
// el hígado está en x < 150 y el corazón se inclina hacia x > 150.
//
// Posición anatómica: brazos separados del tronco y palmas al frente.
// Canon de 8 cabezas con cabeza de 78 px (H). Alturas desde y = 8:
//   1H barbilla (86) · 2H pezones (164) · 3H ombligo (242) · 4H entrepierna y
//   muñecas (320) · 4,7H punta de los dedos (380) · 6H rodillas (476) ·
//   7,5H tobillos (593) · 8H planta (632).

/** El lienzo deja un margen a cada lado de las manos para los rótulos. */
export const VIEW_BOX = { x: -80, y: 0, width: 460, height: 640 }

/** Posición x de los rótulos en cada margen. */
export const LABEL_X = { left: -6, right: 306 }

/** Trazo con su grosor en unidades del viewBox (huesos, vasos, nervios). */
export interface RegionStroke {
  d: string
  width: number
}

const round = (n: number) => Math.round(n * 10) / 10
const mirrorStrokes = (strokes: RegionStroke[]): RegionStroke[] => strokes.map((s) => ({ ...s, d: mirrorPath(s.d) }))
const bothSides = (strokes: RegionStroke[]): RegionStroke[] => [...strokes, ...mirrorStrokes(strokes)]

// --- Contorno del cuerpo ------------------------------------------------

const LEFT_SIDE: Cubic[] = [
  // cráneo y sien
  { c1: [130, 8], c2: [118, 22], to: [118, 46] },
  // pómulo y ángulo de la mandíbula
  { c1: [118, 60], c2: [121, 74], to: [128, 81] },
  // bajo la mandíbula hasta el cuello
  { c1: [131, 85], c2: [133, 87], to: [134, 91] },
  // cuello
  { c1: [134, 100], c2: [132, 107], to: [126, 112] },
  // trapecio hasta el hombro
  { c1: [112, 118], c2: [92, 120], to: [78, 128] },
  // deltoides
  { c1: [64, 134], c2: [56, 150], to: [56, 170] },
  // brazo hasta el codo
  { c1: [54, 196], c2: [46, 222], to: [40, 246] },
  // antebrazo hasta la muñeca
  { c1: [32, 264], c2: [30, 296], to: [24, 318] },
  // pulgar (hacia afuera: palma al frente)
  { c1: [18, 324], c2: [10, 334], to: [8, 346] },
  { c1: [8, 353], c2: [14, 353], to: [17, 345] },
  // índice, medio, anular y meñique
  { c1: [17, 354], c2: [15, 364], to: [14, 376] },
  { c1: [14, 384], c2: [21, 384], to: [21, 377] },
  { c1: [21, 390], c2: [29, 390], to: [29, 379] },
  { c1: [29, 388], c2: [36, 387], to: [36, 377] },
  { c1: [37, 382], c2: [43, 380], to: [42, 370] },
  // borde interno de la mano hasta la muñeca
  { c1: [42, 352], c2: [42, 336], to: [42, 322] },
  // cara interna del antebrazo
  { c1: [46, 300], c2: [54, 272], to: [62, 250] },
  // cara interna del brazo hasta la axila
  { c1: [68, 226], c2: [80, 200], to: [88, 178] },
  // costado del tórax hasta la cintura
  { c1: [88, 206], c2: [94, 236], to: [98, 262] },
  // cintura y cadera
  { c1: [99, 280], c2: [95, 296], to: [94, 312] },
  // muslo hasta la rodilla
  { c1: [90, 356], c2: [102, 430], to: [110, 476] },
  // pantorrilla hasta el tobillo
  { c1: [103, 506], c2: [111, 556], to: [120, 593] },
  // talón
  { c1: [119, 604], c2: [114, 614], to: [112, 622] },
  // dedos del pie y cara interna del pie
  { c1: [116, 632], c2: [138, 634], to: [142, 624] },
  // tobillo interno
  { c1: [142, 612], c2: [140, 600], to: [140, 593] },
  // pantorrilla y rodilla internas
  { c1: [141, 560], c2: [144, 514], to: [136, 476] },
  // muslo interno hasta la entrepierna
  { c1: [140, 430], c2: [146, 350], to: [150, 320] },
]

/** Cabeza, tronco y extremidades en un solo trazo cerrado. */
export const BODY_OUTLINE = symmetricPath([150, 8], LEFT_SIDE)

// --- Esqueleto axial (decorativo) -----------------------------------------
// Se dibuja en color hueso. Lo que queda detrás de los órganos (columna y arco
// posterior de las costillas) va en BACK; lo que queda delante, en FRONT.

// Semiancho de la caja torácica en cada costilla, de la 1.ª a la 10.ª.
const RIB_HALF_WIDTHS = [34, 42, 48, 52, 54, 54, 52, 48, 43, 38]

const LEFT_RIBS = RIB_HALF_WIDTHS.map((halfWidth, i) => {
  const y = 136 + i * 10.5
  const side = 150 - halfWidth
  const sideY = round(y + 10 + i * 0.8)
  // De la 7.ª en adelante no llegan al esternón: terminan en el arco costal.
  const low = Math.max(0, i - 5)
  const startX = 145 - low * 7
  const startY = round(y + 3 + low * 5)
  return {
    // Las dos últimas son flotantes: sin arco anterior.
    front: i < 8 ? `M${startX} ${startY} C${round((startX + side) / 2)} ${round(startY - 5)} ${side} ${round(sideY - 10)} ${side} ${sideY}` : undefined,
    back: `M${side} ${sideY} C${side} ${round(sideY - 14)} ${round(150 - halfWidth * 0.45)} ${round(y - 8)} 146 ${round(y - 6)}`,
  }
})

const LEFT_FRONT_BONES: RegionStroke[] = [
  // clavícula
  { d: 'M146 127 C128 120 104 124 82 137', width: 3 },
  // arco costal
  { d: 'M145 203 C140 213 134 223 123 241', width: 1.8 },
  ...LEFT_RIBS.flatMap((rib) => (rib.front ? [{ d: rib.front, width: 2.3 }] : [])),
  // rama del pubis e isquion
  { d: 'M118 322 C120 338 136 346 150 336', width: 3.4 },
  // mandíbula
  { d: 'M127 66 C129 80 140 90 150 91', width: 2.2 },
]

const LEFT_BACK_BONES: RegionStroke[] = LEFT_RIBS.map((rib) => ({ d: rib.back, width: 1.7 }))

export const FRONT_BONES: RegionStroke[] = bothSides(LEFT_FRONT_BONES)
export const BACK_BONES: RegionStroke[] = bothSides(LEFT_BACK_BONES)

// 24 vértebras, más anchas hacia la región lumbar, y el sacro.
const VERTEBRAE = Array.from({ length: 24 }, (_, i) => {
  const y = round(98 + i * 8.3)
  const half = round(4 + i * 0.2)
  return `M${150 - half} ${y} L${150 + half} ${y} L${150 + half} ${round(y + 5.8)} L${150 - half} ${round(y + 5.8)} Z`
})
const SACRUM = 'M140 298 L160 298 C158 310 154 322 150 328 C146 322 142 310 140 298 Z'

// Ala ilíaca en media luna: cresta arriba, acetábulo abajo y fosa ilíaca abierta.
const LEFT_ILIUM = 'M141 298 C132 286 112 278 102 286 C98 298 104 314 114 322 C120 318 124 308 132 306 C136 306 139 310 141 314 Z'
const LEFT_EYE_SOCKET = 'M133 56 C133 50 144 50 144 56 C144 62 133 62 133 56 Z'

/** Piezas óseas rellenas detrás de los órganos. */
export const BACK_BONE_SHAPES: string[] = [joinPaths(...VERTEBRAE), SACRUM]

/** Piezas óseas rellenas delante de los órganos. */
export const FRONT_BONE_SHAPES: string[] = [
  // manubrio, cuerpo del esternón y apéndice xifoides
  'M142 126 L158 126 L155 141 L154 196 L150 208 L146 196 L145 141 Z',
  LEFT_ILIUM,
  mirrorPath(LEFT_ILIUM),
]

/** Cráneo: bóveda y cara translúcidas; las cuencas y la nariz van oscuras. */
export const SKULL = {
  cranium: 'M150 13 C132 13 122 28 122 45 C122 57 127 64 131 68 L134 80 C140 88 160 88 166 80 L169 68 C173 64 178 57 178 45 C178 28 168 13 150 13 Z',
  hollows: [LEFT_EYE_SOCKET, mirrorPath(LEFT_EYE_SOCKET), 'M150 60 L146 70 L154 70 Z'],
  teeth: 'M139 77 L161 77',
}

// --- Líneas decorativas ------------------------------------------------------

const LEFT_ANATOMY: string[] = [
  // esternocleidomastoideo
  'M136 90 C139 100 143 108 147 114',
  // pliegues del cerebro
  'M132 30 C138 24 144 28 146 34',
  'M128 40 C134 36 140 40 142 46',
  // asas intestinales
  'M114 280 C130 272 146 288 162 280 C176 272 186 278 186 284',
  'M114 292 C130 284 146 300 162 292 C176 284 186 290 186 296',
  // separación de los dedos
  'M21 377 L23 354',
  'M29 379 L30 354',
  'M36 377 L36 354',
  // rótula
  'M116 470 C116 462 130 462 130 470 C130 480 116 480 116 470',
]

const LEFT_SURFACE: string[] = [
  // trapecio
  'M128 112 C120 120 104 124 92 126',
  // borde inferior del pectoral
  'M146 190 C132 198 108 196 92 178',
  // surco deltopectoral y bíceps
  'M62 172 C68 182 78 186 86 180',
  'M60 200 C58 220 54 236 50 248',
  // borde del recto abdominal
  'M128 204 C126 230 128 270 136 300',
  // pliegue inguinal
  'M98 300 C112 312 132 322 148 326',
  // cuádriceps y gemelo
  'M112 350 C116 400 120 440 122 466',
  'M128 500 C134 530 134 560 132 588',
]

/** Relieve muscular de la superficie, muy tenue. */
export const SURFACE_LINES: string[] = [...LEFT_SURFACE, ...LEFT_SURFACE.map((d) => mirrorPath(d))]

/** Pliegues, asas y detalles de superficie. No son interactivos. */
export const ANATOMY_LINES: string[] = ['M150 18 L150 48', ...LEFT_ANATOMY, ...LEFT_ANATOMY.map((d) => mirrorPath(d))]

const LEFT_VESSELS: RegionStroke[] = [
  // carótida hasta la cara
  { d: 'M150 130 C146 118 144 104 142 90 C141 80 138 70 136 60', width: 1.8 },
  // subclavia, braquial y radial hasta la mano
  { d: 'M150 136 C124 134 100 140 82 158 C70 192 58 224 50 250 C44 276 36 300 30 320 C26 336 20 352 17 368', width: 1.8 },
  // cubital y arco palmar
  { d: 'M50 250 C48 278 42 302 38 322 C38 340 38 356 38 370', width: 1.3 },
  // ramas coronarias y torácicas
  { d: 'M150 168 C136 172 122 186 114 204', width: 1.2 },
  // renal
  { d: 'M150 270 C138 272 128 278 120 286', width: 1.3 },
  // ilíaca y femoral hasta el pie
  { d: 'M150 300 C136 320 122 360 118 420 C116 470 120 540 122 600', width: 2 },
  { d: 'M150 300 C146 340 138 390 138 440', width: 1.3 },
]

/**
 * Árbol vascular: aorta, carótidas, arterias de brazos y piernas. Se pinta
 * con el color del nivel del sistema cardiovascular.
 */
export const VESSEL_LINES: RegionStroke[] = [
  { d: 'M150 166 C144 150 146 138 150 128', width: 3.2 },
  { d: 'M152 222 L150 300', width: 3.2 },
  ...bothSides(LEFT_VESSELS),
]

const LEFT_NERVES: RegionStroke[] = [
  // plexo braquial y nervio radial
  { d: 'M147 116 C128 124 104 138 86 160 C74 194 62 228 56 252 C50 278 42 302 35 322', width: 1.3 },
  // mediano y ramas digitales
  { d: 'M56 252 C54 282 46 306 40 324 C36 344 33 364 31 380', width: 1 },
  { d: 'M35 322 C31 340 25 360 23 377', width: 0.9 },
  // intercostales
  { d: 'M148 176 C130 178 112 188 102 204', width: 0.9 },
  { d: 'M148 206 C132 210 116 222 108 238', width: 0.9 },
  // plexo lumbar y nervio femoral
  { d: 'M148 268 C136 288 124 312 120 344 C114 392 116 440 121 476 C123 520 127 560 129 598', width: 1.3 },
  // ciático
  { d: 'M148 300 C140 318 132 342 130 382 C128 420 130 450 133 476', width: 1.1 },
]

/** Nervios periféricos. Se pintan con el color del nivel del sistema nervioso. */
export const NERVE_LINES: RegionStroke[] = [{ d: 'M150 50 L150 98', width: 1.6 }, ...bothSides(LEFT_NERVES)]

// --- Regiones por sistema -------------------------------------------------

export interface RegionShape {
  systemId: BodySystemId
  /** Un `path` en coordenadas del viewBox. */
  d: string
  /**
   * Si está, el nivel se pinta sobre estos trazos y `d` queda como zona
   * sensible con un tinte tenue (extremidades: se colorean los huesos).
   */
  strokes?: RegionStroke[]
  /** Rótulo del nivel en el margen (`side`) y punto del órgano al que apunta la línea guía. */
  label: { side: 'left' | 'right'; y: number; to: [number, number] }
}

const LEFT_LUNG =
  'M140 138 C124 134 106 146 102 166 C96 192 98 218 104 236 C110 246 130 248 140 238 C144 214 144 176 140 138 Z'
// El pulmón izquierdo del paciente (derecha del espectador) tiene la escotadura cardíaca.
const RIGHT_LUNG =
  'M160 138 C176 134 194 146 198 166 C204 192 202 218 196 236 C190 246 170 248 162 238 C158 222 166 208 176 198 C168 186 160 174 160 138 Z'

const LEFT_KIDNEY = 'M118 268 C106 268 102 282 104 294 C106 304 116 308 122 304 C118 296 118 284 122 274 C121 270 120 268 118 268 Z'

const LEFT_ARM = 'M58 176 C54 200 46 224 40 246 C32 264 30 296 24 318 L42 322 C46 300 54 272 62 250 C68 226 80 200 86 180 Z'
const LEFT_LEG =
  'M96 328 C92 370 104 430 110 476 C103 506 111 556 120 593 L140 593 C141 560 144 514 136 476 C140 430 146 350 148 328 Z'

// Huesos largos del lado izquierdo del espectador, entre las articulaciones del contorno.
const LEFT_BONES: RegionStroke[] = [
  // húmero, radio (lado del pulgar) y cúbito
  { d: 'M77 148 C71 184 61 218 52 246', width: 4.4 },
  { d: 'M47 254 C42 278 34 300 28 318', width: 2.4 },
  { d: 'M54 255 C50 280 42 302 37 320', width: 2.4 },
  // metacarpianos y falanges
  { d: 'M27 326 C22 332 15 338 11 347', width: 1.4 },
  { d: 'M29 328 C24 344 19 360 17 378', width: 1.4 },
  { d: 'M32 329 C29 346 26 364 25 383', width: 1.4 },
  { d: 'M35 329 C34 346 33 364 32 381', width: 1.4 },
  { d: 'M38 328 C39 344 39 358 39 373', width: 1.4 },
  // fémur con su cabeza hacia la cadera
  { d: 'M124 320 C114 320 109 330 111 344 C113 390 118 434 122 466', width: 5.4 },
  // tibia y peroné
  { d: 'M126 486 C128 524 131 560 131 591', width: 4.2 },
  { d: 'M117 488 C117 524 122 560 124 590', width: 2.2 },
  // pie
  { d: 'M130 598 C130 610 128 618 126 626', width: 3 },
]

export const REGION_SHAPES: RegionShape[] = [
  {
    systemId: 'nervous',
    // encéfalo dentro de la bóveda del cráneo
    d: 'M150 17 C134 17 126 27 126 36 C126 44 134 50 150 50 C166 50 174 44 174 36 C174 27 166 17 150 17 Z',
    label: { side: 'right', y: 34, to: [174, 35] },
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
    label: { side: 'left', y: 150, to: [106, 152] },
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
    d: 'M102 244 C110 232 134 232 156 238 C162 242 160 254 152 260 C134 270 112 268 102 260 C98 254 98 250 102 244 Z',
    label: { side: 'left', y: 236, to: [102, 250] },
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
    label: { side: 'left', y: 296, to: [104, 290] },
  },
  {
    systemId: 'reproductive',
    d: 'M136 312 C142 308 158 308 164 312 C166 320 158 330 150 332 C142 330 134 320 136 312 Z',
    label: { side: 'right', y: 318, to: [164, 316] },
  },
  {
    systemId: 'musculoskeletal',
    d: joinPaths(LEFT_ARM, mirrorPath(LEFT_ARM), LEFT_LEG, mirrorPath(LEFT_LEG)),
    strokes: bothSides(LEFT_BONES),
    label: { side: 'left', y: 470, to: [110, 470] },
  },
]
