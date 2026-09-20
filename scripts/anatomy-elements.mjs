// Resuelve un concepto FMA (compuesto, p. ej. "heart") a la lista de mallas
// finas ("element file id", `FJ####.obj`) que hay que unir para
// reconstruirlo, usando la tabla oficial de BodyParts3D. En este conjunto de
// datos, la mayoría de los órganos completos no son un solo archivo: son la
// unión de decenas de piezas finas (el corazón, por ejemplo, son 83).
//
// Fuente: vendor/bodyparts3d/partof_element_parts.txt (columnas: concept id,
// name, element file id), descargado junto con las mallas — ver
// docs/reference/bodyparts3d.md.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
export const OBJ_DIR = path.join(root, 'vendor', 'bodyparts3d', 'obj')
const ELEMENT_PARTS_FILE = path.join(root, 'vendor', 'bodyparts3d', 'partof_element_parts.txt')

/** @returns {Map<string, string[]>} id de concepto FMA → lista de ids de archivo FJ */
export function loadElementIndex() {
  const text = readFileSync(ELEMENT_PARTS_FILE, 'utf-8')
  const index = new Map()
  for (const line of text.split('\n').slice(1)) {
    const [fma, , fj] = line.split('\t')
    if (!fma || !fj) continue
    const trimmedFj = fj.trim()
    const list = index.get(fma) ?? []
    list.push(trimmedFj)
    index.set(fma, list)
  }
  return index
}

/** Los archivos FJ que forman un concepto FMA, o `undefined` si no está en la tabla oficial. */
export function elementFilesFor(index, fma) {
  return index.get(fma)
}
