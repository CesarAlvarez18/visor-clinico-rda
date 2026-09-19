import type { EncounterRecord, PatientSummary } from '../domain/types'
import { parseBundle } from '../fhir/parseBundle'
import { validateBundle } from '../fhir/validateBundle'

export interface NamedInput {
  name: string
  data: unknown
}

export interface PatientHistory {
  patient: PatientSummary
  /** Atenciones ordenadas de la más reciente a la más antigua. */
  encounters: EncounterRecord[]
}

export class BundleLoadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BundleLoadError'
  }
}

function readText(file: File): Promise<string> {
  // FileReader en lugar de File.text(): funciona igual en el navegador y en jsdom.
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new BundleLoadError(`No se pudo leer ${file.name}.`))
    reader.readAsText(file)
  })
}

/** Lee archivos JSON del navegador. Lanza BundleLoadError si alguno no es JSON válido. */
export async function readJsonFiles(files: File[]): Promise<NamedInput[]> {
  return Promise.all(
    files.map(async (file) => {
      const text = await readText(file)
      try {
        return { name: file.name, data: JSON.parse(text) as unknown }
      } catch {
        throw new BundleLoadError(`${file.name} no es un archivo JSON válido.`)
      }
    }),
  )
}

/**
 * Valida y lee un conjunto de Bundles RDA de un mismo paciente. Si cualquiera
 * falla, se rechaza todo el conjunto: no se muestra nada parcial.
 */
export function buildHistory(inputs: NamedInput[]): PatientHistory {
  if (inputs.length === 0) throw new BundleLoadError('No se seleccionó ningún archivo.')

  const encounters = inputs.map(({ name, data }) => {
    const result = validateBundle(data, name)
    if (!result.ok) throw new BundleLoadError(result.error)
    try {
      return parseBundle(result.bundle)
    } catch (error) {
      throw new BundleLoadError(`${name}: ${error instanceof Error ? error.message : 'no se pudo leer el documento.'}`)
    }
  })

  const identities = new Set(encounters.map((e) => patientIdentity(e.patient)))
  if (identities.size > 1) {
    throw new BundleLoadError('Los archivos pertenecen a pacientes distintos. Cargue solo los documentos de un paciente.')
  }

  const sorted = [...encounters].sort((a, b) => b.encounter.start.localeCompare(a.encounter.start))
  return { patient: sorted[0].patient, encounters: sorted }
}

function patientIdentity(patient: PatientSummary): string {
  return patient.identifier ? `${patient.identifierType ?? ''}:${patient.identifier}` : `id:${patient.id}`
}
