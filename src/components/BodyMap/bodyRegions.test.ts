import {
  ANATOMY_LINES,
  BACK_BONES,
  BACK_BONE_SHAPES,
  BODY_OUTLINE,
  FRONT_BONES,
  FRONT_BONE_SHAPES,
  NERVE_LINES,
  REGION_SHAPES,
  SKULL,
  SURFACE_LINES,
  VESSEL_LINES,
} from './bodyRegions'

// Un path SVG mal formado no rompe la aplicación, solo deja de dibujarse y
// escribe un error en consola; esta prueba lo detecta antes.
// Números que consume cada comando SVG usado en la silueta.
const COMMAND_ARITY: Record<string, number> = { M: 2, L: 2, C: 6, H: 1, V: 1, m: 2, l: 2, c: 6, h: 1, v: 1, Z: 0, z: 0 }

function assertWellFormed(d: string) {
  const tokens = d.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) ?? []
  // Todo lo que no sea comando o número (p. ej. "150110" pegado es un número
  // válido, pero rompe la paridad de coordenadas del comando).
  expect(tokens.join(' ').replace(/[\s,]+/g, '')).toBe(d.replace(/[\s,]+/g, ''))

  let command = ''
  let count = 0
  const flush = () => {
    if (!command) return
    const arity = COMMAND_ARITY[command]
    expect(arity, `comando ${command} desconocido en "${d}"`).toBeDefined()
    if (arity === 0) expect(count).toBe(0)
    else expect(count % arity, `coordenadas incompletas tras "${command}" en "${d}"`).toBe(0)
  }
  for (const token of tokens) {
    if (/^[A-Za-z]$/.test(token)) {
      flush()
      command = token
      count = 0
    } else {
      count += 1
    }
  }
  flush()
}

describe('geometría de la silueta', () => {
  it('los paths del contorno están bien formados', () => {
    assertWellFormed(BODY_OUTLINE)
  })

  it('las líneas anatómicas están bien formadas', () => {
    for (const d of [...ANATOMY_LINES, ...SURFACE_LINES]) assertWellFormed(d)
    for (const { d } of [...VESSEL_LINES, ...NERVE_LINES, ...FRONT_BONES, ...BACK_BONES]) assertWellFormed(d)
    for (const d of [...FRONT_BONE_SHAPES, ...BACK_BONE_SHAPES, SKULL.cranium, SKULL.teeth, ...SKULL.hollows]) assertWellFormed(d)
  })

  it('cada región tiene un path bien formado', () => {
    for (const shape of REGION_SHAPES) {
      assertWellFormed(shape.d)
      for (const { d } of shape.strokes ?? []) assertWellFormed(d)
    }
  })
})
