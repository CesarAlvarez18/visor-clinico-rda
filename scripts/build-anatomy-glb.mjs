#!/usr/bin/env node
// Arma public/models/anatomy.glb a partir de las mallas OBJ de BodyParts3D
// (ver docs/reference/bodyparts3d.md y scripts/anatomy-parts.mjs).
//
// Por grupo (skin, skeleton, system:<id>): une las mallas de sus partes,
// suelda vértices duplicados, simplifica (menos agresivo en vasos y
// nervios, para no romper los tubos finos), recalcula normales, cuantiza y
// comprime con Meshopt. Un nodo por grupo, con el nombre exacto del
// contrato (classifyMesh.ts).
//
// Uso: npm run build:model
// Requiere haber extraído vendor/bodyparts3d/partof_BP3D_4.0_obj_99.zip en
// vendor/bodyparts3d/obj/ (ver docs/reference/bodyparts3d.md).

import { Document, NodeIO } from '@gltf-transform/core'
import { EXTMeshoptCompression } from '@gltf-transform/extensions'
import { meshopt, simplifyPrimitive, weld } from '@gltf-transform/functions'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import { elementFilesFor, loadElementIndex, OBJ_DIR } from './anatomy-elements.mjs'
import { GROUPS } from './anatomy-parts.mjs'

// Los 9 sistemas con estructura propia (display: 'region' en
// src/rules/config/bodySystems.ts). Duplicado a propósito: este script se
// ejecuta con Node plano, sin pasar por tsc, así que no importa TypeScript
// de src/. Si esa lista cambia, actualizar también aquí.
const MODEL_SYSTEM_IDS = [
  'cardiovascular',
  'respiratory',
  'nervous',
  'digestive',
  'hepatic',
  'renal',
  'endocrine',
  'musculoskeletal',
  'reproductive',
]

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const outFile = path.join(root, 'public', 'models', 'anatomy.glb')
const MAX_BYTES = 10 * 1024 * 1024

// BodyParts3D viene en milímetros con el eje Z hacia arriba. La escena
// espera metros, Y hacia arriba, de frente a +Z (normalizeModel.ts ajusta
// estatura y pies después de cargar el GLB).
const MM_TO_M = 1 / 1000
function toSceneSpace([x, y, z]) {
  return [x * MM_TO_M, z * MM_TO_M, -y * MM_TO_M]
}

/** Razón de simplificación (meshoptimizer) por grupo: 0 = sin cambios, 1 = máxima reducción. */
const SIMPLIFY_RATIO = {
  skin: 0.15,
  skeleton: 0.12,
  'system:cardiovascular': 0.45, // vasos finos: se reduce menos para no romper los tubos
  'system:nervous': 0.45, // nervios/médula: igual de finos
  'system:respiratory': 0.2,
  'system:digestive': 0.2,
  'system:hepatic': 0.15,
  'system:renal': 0.2,
  'system:endocrine': 0.25,
  'system:musculoskeletal': 0.15,
  'system:reproductive': 0.2,
}
const DEFAULT_RATIO = 0.2

/** Igual que `toSceneSpace`, pero para direcciones (normales): sin la escala mm → m. */
function toSceneDirection([x, y, z]) {
  return [x, z, -y]
}

/**
 * Lector mínimo de OBJ: `v`, `vn` y `f` (BodyParts3D no trae materiales ni
 * UVs). Los archivos de BodyParts3D traen una normal por vértice, con el
 * mismo índice que su posición (`f i//i j//j k//k`); si algún archivo no
 * cumple esa correspondencia, se descarta esa normal (three.js calcula
 * normales de repuesto al cargar si faltan).
 */
function parseObj(filePath) {
  const positions = []
  const normals = []
  const indices = []
  const text = readFileSync(filePath, 'utf-8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('v ')) {
      const [x, y, z] = trimmed.slice(2).trim().split(/\s+/).map(Number)
      positions.push(...toSceneSpace([x, y, z]))
    } else if (trimmed.startsWith('vn ')) {
      const [x, y, z] = trimmed.slice(3).trim().split(/\s+/).map(Number)
      normals.push(...toSceneDirection([x, y, z]))
    } else if (trimmed.startsWith('f ')) {
      // Cada referencia de cara puede venir como "i", "i/j" o "i/j/k"; solo interesa el índice de vértice.
      const refs = trimmed
        .slice(2)
        .trim()
        .split(/\s+/)
        .map((token) => {
          const vertexIndex = Number(token.split('/')[0])
          return vertexIndex > 0 ? vertexIndex - 1 : positions.length / 3 + vertexIndex
        })
      // Abanico (fan) para caras con más de 3 vértices.
      for (let i = 1; i < refs.length - 1; i++) indices.push(refs[0], refs[i], refs[i + 1])
    }
  }
  const vertexCount = positions.length / 3
  const hasMatchingNormals = normals.length / 3 === vertexCount
  return {
    positions: new Float32Array(positions),
    normals: hasMatchingNormals ? new Float32Array(normals) : null,
    indices: new Uint32Array(indices),
  }
}

/**
 * Cada concepto FMA de la tabla es, en BodyParts3D, la unión de varias
 * mallas finas ("element file id", `FJ####.obj`) — un órgano completo como
 * el corazón son 83 archivos. `elementIndex` resuelve esa lista (ver
 * anatomy-elements.mjs).
 */
function objFilesFor(parts, group, elementIndex) {
  const files = []
  for (const part of parts) {
    const elementIds = elementFilesFor(elementIndex, part.fma)
    if (!elementIds || elementIds.length === 0) {
      throw new Error(`${part.fma} (${part.name}, grupo "${group}") no aparece en partof_element_parts.txt.`)
    }
    for (const fj of elementIds) files.push({ file: path.join(OBJ_DIR, `${fj}.obj`), part })
  }
  return files
}

/** Une varias mallas (cada una con su propio conteo de vértices) en una sola. */
function mergeFiles(objFiles, group) {
  let vertexCount = 0
  let indexCount = 0
  const chunks = []
  for (const { file, part } of objFiles) {
    if (!existsSync(file)) {
      throw new Error(`Falta ${file} (grupo "${group}", ${part.name} / ${part.fma}). Extrae el zip de BodyParts3D primero.`)
    }
    const geometry = parseObj(file)
    chunks.push({ geometry, vertexOffset: vertexCount })
    vertexCount += geometry.positions.length / 3
    indexCount += geometry.indices.length
  }
  const positions = new Float32Array(vertexCount * 3)
  // Solo se incluyen normales si TODAS las piezas del grupo las traen con la
  // correspondencia esperada; si falta alguna, three.js las calcula al cargar.
  const allHaveNormals = chunks.every(({ geometry }) => geometry.normals)
  const normals = allHaveNormals ? new Float32Array(vertexCount * 3) : null
  const indices = new Uint32Array(indexCount)
  let vertexCursor = 0
  let indexCursor = 0
  for (const { geometry, vertexOffset } of chunks) {
    positions.set(geometry.positions, vertexCursor * 3)
    if (normals) normals.set(geometry.normals, vertexCursor * 3)
    vertexCursor += geometry.positions.length / 3
    for (const index of geometry.indices) indices[indexCursor++] = index + vertexOffset
  }
  return { positions, normals, indices }
}

async function main() {
  if (!existsSync(OBJ_DIR)) {
    console.error(`No se encontró ${OBJ_DIR}.`)
    console.error('Extrae vendor/bodyparts3d/partof_BP3D_4.0_obj_99.zip ahí antes de construir el modelo (ver docs/reference/bodyparts3d.md).')
    process.exit(1)
  }

  const elementIndex = loadElementIndex()
  await MeshoptEncoder.ready
  await MeshoptSimplifier.ready

  const document = new Document()
  const buffer = document.createBuffer()
  const scene = document.createScene('anatomy')
  const root3 = document.createNode('anatomy-root')
  scene.addChild(root3)

  const report = []
  for (const [group, parts] of Object.entries(GROUPS)) {
    const objFiles = objFilesFor(parts, group, elementIndex)
    const merged = mergeFiles(objFiles, group)
    const primitive = document
      .createPrimitive()
      .setAttribute('POSITION', document.createAccessor().setType('VEC3').setArray(merged.positions).setBuffer(buffer))
      .setIndices(document.createAccessor().setType('SCALAR').setArray(merged.indices).setBuffer(buffer))
    if (merged.normals) {
      primitive.setAttribute('NORMAL', document.createAccessor().setType('VEC3').setArray(merged.normals).setBuffer(buffer))
    } else {
      console.warn(`${group}: sin normales de origen (formato inesperado); three.js las calculará al cargar.`)
    }

    const mesh = document.createMesh(group).addPrimitive(primitive)
    const node = document.createNode(group).setMesh(mesh)
    root3.addChild(node)

    report.push({ group, concepts: parts.length, files: objFiles.length, triangles: merged.indices.length / 3 })
  }

  // Soldar antes de simplificar: junta los vértices duplicados que deja la
  // unión de varias piezas OBJ y mejora el resultado del simplificador
  // (recomendado por la documentación de `simplify`).
  await document.transform(weld())

  for (const mesh of document.getRoot().listMeshes()) {
    const ratio = SIMPLIFY_RATIO[mesh.getName()] ?? DEFAULT_RATIO
    for (const primitive of mesh.listPrimitives()) {
      simplifyPrimitive(primitive, { simplifier: MeshoptSimplifier, ratio, error: 0.001 })
    }
  }
  await document.transform(weld())

  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression])
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

  await document.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }))

  await io.write(outFile, document)

  const finalSize = statSync(outFile).size
  console.log('Grupo'.padEnd(28), 'Conceptos'.padEnd(10), 'Archivos'.padEnd(9), 'Triángulos')
  for (const row of report) {
    console.log(row.group.padEnd(28), String(row.concepts).padEnd(10), String(row.files).padEnd(9), row.triangles)
  }
  console.log(`\nTotal: ${(finalSize / 1024 / 1024).toFixed(2)} MB → ${outFile}`)

  const groupNames = new Set(Object.keys(GROUPS))
  const missingSystems = MODEL_SYSTEM_IDS.filter((id) => !groupNames.has(`system:${id}`))
  if (missingSystems.length > 0) {
    console.error(`Faltan grupos para: ${missingSystems.join(', ')}`)
    process.exitCode = 1
  }
  if (finalSize > MAX_BYTES) {
    console.error(`El GLB pesa más de 10 MB (${(finalSize / 1024 / 1024).toFixed(2)} MB).`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
