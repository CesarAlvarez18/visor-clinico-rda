// Utilidades para construir paths SVG simétricos. Todas las coordenadas son
// absolutas y el eje de simetría es vertical, en x = axis.

export type Point = [number, number]

/** Segmento cúbico absoluto: dos puntos de control y el punto final. */
export interface Cubic {
  c1: Point
  c2: Point
  to: Point
}

function fmt([x, y]: Point): string {
  return `${round(x)} ${round(y)}`
}

function round(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Cierra una figura simétrica: recorre `left` desde `start` (que debe estar
 * sobre el eje) hasta un punto final también sobre el eje, y vuelve por el
 * lado derecho reflejando los mismos segmentos en orden inverso.
 */
export function symmetricPath(start: Point, left: Cubic[], axis = 150): string {
  const mirror = ([x, y]: Point): Point => [2 * axis - x, y]
  const parts = [`M${fmt(start)}`]
  for (const seg of left) parts.push(`C${fmt(seg.c1)} ${fmt(seg.c2)} ${fmt(seg.to)}`)

  // Camino de vuelta: cada cúbica P0→P3 reflejada se recorre P3'→P0' con los
  // controles intercambiados.
  const points: Point[] = [start, ...left.map((s) => s.to)]
  for (let i = left.length - 1; i >= 0; i -= 1) {
    const seg = left[i]
    const from = points[i]
    parts.push(`C${fmt(mirror(seg.c2))} ${fmt(mirror(seg.c1))} ${fmt(mirror(from))}`)
  }
  parts.push('Z')
  return parts.join(' ')
}

/**
 * Refleja un path escrito solo con comandos absolutos M, L, C y Z. Sirve para
 * obtener el órgano o la extremidad del otro lado a partir del izquierdo.
 */
export function mirrorPath(d: string, axis = 150): string {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/g) ?? []
  const out: string[] = []
  let isX = true
  for (const token of tokens) {
    if (/^[MLCZ]$/.test(token)) {
      out.push(token)
      isX = true
    } else {
      const value = Number(token)
      out.push(String(round(isX ? 2 * axis - value : value)))
      isX = !isX
    }
  }
  return out.join(' ').replace(/([MLC]) /g, '$1')
}

/** Une varios subpaths en un solo atributo `d`. */
export function joinPaths(...paths: string[]): string {
  return paths.join(' ')
}
