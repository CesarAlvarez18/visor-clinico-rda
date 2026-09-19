import type { Bundle } from 'fhir/r4'

export type ValidationResult = { ok: true; bundle: Bundle } | { ok: false; error: string }

/**
 * Comprobación mínima de que un JSON es un documento RDA que el visor puede
 * leer. No valida contra los perfiles de la guía; solo evita dibujar con
 * datos parciales cuando el archivo no es lo que se espera.
 */
export function validateBundle(input: unknown, fileName = 'el archivo'): ValidationResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, error: `${fileName} no contiene un recurso FHIR (se esperaba un objeto JSON).` }
  }
  const candidate = input as Partial<Bundle> & { resourceType?: string }
  if (candidate.resourceType !== 'Bundle') {
    return { ok: false, error: `${fileName} no es un Bundle FHIR (resourceType: ${candidate.resourceType ?? 'ausente'}).` }
  }
  if (candidate.type !== 'document') {
    return { ok: false, error: `${fileName} no es un documento RDA (Bundle.type: ${candidate.type ?? 'ausente'}, se esperaba "document").` }
  }
  const entries = candidate.entry ?? []
  if (entries.length === 0) {
    return { ok: false, error: `${fileName} es un Bundle vacío.` }
  }
  if (entries[0]?.resource?.resourceType !== 'Composition') {
    return { ok: false, error: `${fileName} no tiene una Composition como primera entrada del documento.` }
  }
  const types = new Set(entries.map((e) => e.resource?.resourceType))
  if (!types.has('Patient')) {
    return { ok: false, error: `${fileName} no incluye el recurso Patient.` }
  }
  if (!types.has('Encounter')) {
    return { ok: false, error: `${fileName} no incluye el recurso Encounter de la atención.` }
  }
  return { ok: true, bundle: candidate as Bundle }
}
