import type { Level } from './levels'
import type { BodySystemId } from './config/bodySystems'
import { ICD10_TO_SYSTEM, type Icd10Range } from './config/icd10ToSystem'

export interface Icd10Mapping {
  system: BodySystemId
  minLevel?: Level
  range: Icd10Range
}

/** Normaliza un código CIE-10 a mayúsculas y sin punto: "i10", "I10.0", "I100" → "I10", "I100", "I100". */
export function normalizeIcd10(code: string): string {
  return code.trim().toUpperCase().replace(/\./g, '')
}

/**
 * Compara dos códigos normalizados como se ordenan en CIE-10: primero la
 * letra, luego los dígitos. Un código más corto se compara como prefijo, de
 * modo que "I21" está dentro del rango I21–I22 y "I210" también.
 */
function inRange(code: string, from: string, to: string): boolean {
  const category = code.slice(0, 3)
  return category >= from.slice(0, 3) && category <= to.slice(0, 3) && matchesSubcode(code, from, to)
}

function matchesSubcode(code: string, from: string, to: string): boolean {
  // Si el rango se define solo por categorías (3 caracteres), cualquier subcódigo entra.
  if (from.length <= 3 && to.length <= 3) return true
  const padded = code.padEnd(Math.max(from.length, to.length), '0')
  return padded >= from.padEnd(padded.length, '0') && padded <= to.padEnd(padded.length, '9')
}

export function mapIcd10(code: string | undefined, ranges: readonly Icd10Range[] = ICD10_TO_SYSTEM): Icd10Mapping | undefined {
  if (!code) return undefined
  const normalized = normalizeIcd10(code)
  if (!/^[A-Z]\d{2}/.test(normalized)) return undefined
  const range = ranges.find((r) => inRange(normalized, normalizeIcd10(r.from), normalizeIcd10(r.to)))
  return range ? { system: range.system, minLevel: range.minLevel, range } : undefined
}
