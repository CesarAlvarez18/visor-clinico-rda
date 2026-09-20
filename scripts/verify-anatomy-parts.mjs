#!/usr/bin/env node
// Comprueba la tabla parte → grupo de scripts/anatomy-parts.mjs contra las
// mallas descargadas de BodyParts3D: cada concepto FMA debe resolver (vía
// partof_element_parts.txt) a al menos un archivo FJ####.obj existente, y
// ningún archivo puede quedar en dos grupos (Tarea 8 del plan de la vista 3D).
//
// Uso: node scripts/verify-anatomy-parts.mjs
// Requiere haber extraído vendor/bodyparts3d/partof_BP3D_4.0_obj_99.zip en
// vendor/bodyparts3d/obj/ (ver docs/reference/bodyparts3d.md).

import { existsSync } from 'node:fs'
import path from 'node:path'
import { elementFilesFor, loadElementIndex, OBJ_DIR } from './anatomy-elements.mjs'
import { GROUPS } from './anatomy-parts.mjs'

function fail(message) {
  console.error(`✗ ${message}`)
  process.exitCode = 1
}

if (!existsSync(OBJ_DIR)) {
  console.error(`No se encontró ${OBJ_DIR}.`)
  console.error('Extrae vendor/bodyparts3d/partof_BP3D_4.0_obj_99.zip ahí antes de verificar (ver docs/reference/bodyparts3d.md).')
  process.exit(1)
}

const elementIndex = loadElementIndex()
const seenBy = new Map() // archivo FJ -> primer grupo (y concepto) donde aparece
let missingConcepts = 0
let missingFiles = 0
let duplicated = 0
let totalConcepts = 0
let totalFiles = 0

for (const [group, parts] of Object.entries(GROUPS)) {
  for (const part of parts) {
    totalConcepts++
    const elementIds = elementFilesFor(elementIndex, part.fma)
    if (!elementIds || elementIds.length === 0) {
      fail(`${group}: ${part.fma} (${part.name}) no aparece en partof_element_parts.txt`)
      missingConcepts++
      continue
    }
    for (const fj of elementIds) {
      totalFiles++
      const filePath = path.join(OBJ_DIR, `${fj}.obj`)
      if (!existsSync(filePath)) {
        fail(`${group}: ${fj}.obj (parte de ${part.name}, ${part.fma}) no existe en ${OBJ_DIR}`)
        missingFiles++
        continue
      }
      const owner = seenBy.get(fj)
      if (owner && owner.group !== group) {
        fail(`${fj}.obj está en dos grupos: "${owner.group}" (${owner.name}) y "${group}" (${part.name})`)
        duplicated++
      } else {
        seenBy.set(fj, { group, name: part.name })
      }
    }
  }
}

console.log(`${totalConcepts} conceptos FMA en ${Object.keys(GROUPS).length} grupos → ${totalFiles} archivos .obj.`)
if (missingConcepts === 0 && missingFiles === 0 && duplicated === 0) {
  console.log('✓ Todos los conceptos resuelven a archivos .obj existentes y ninguno se repite entre grupos.')
} else {
  console.error(`${missingConcepts} concepto(s) sin resolver, ${missingFiles} archivo(s) faltante(s), ${duplicated} archivo(s) duplicado(s) entre grupos.`)
}
