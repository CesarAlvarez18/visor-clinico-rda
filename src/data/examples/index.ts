import type { Bundle } from 'fhir/r4'

// Bundles RDA sintéticos generados con scripts/generate-examples.mjs.
// Solo datos ficticios: nunca datos reales de pacientes.

export interface ExamplePatient {
  id: string
  label: string
  description: string
  files: string[]
}

const modules = import.meta.glob<Bundle>('./paciente-*/*.json', { import: 'default' })

export const examplePatients: ExamplePatient[] = [
  {
    id: 'paciente-01',
    label: 'Paciente Prueba Uno',
    description: 'Hombre de 64 años: hipertensión, infarto con hospitalización y control posterior. Cuatro atenciones.',
    files: [
      './paciente-01/consulta-2025-11-03.json',
      './paciente-01/urgencias-2026-03-14.json',
      './paciente-01/hospitalizacion-2026-03-15.json',
      './paciente-01/consulta-2026-08-20.json',
    ],
  },
  {
    id: 'paciente-02',
    label: 'Paciente Prueba Dos',
    description: 'Mujer de 35 años con una consulta por infección respiratoria. Una atención.',
    files: ['./paciente-02/consulta-2026-05-02.json'],
  },
]

export async function loadExampleBundles(patient: ExamplePatient): Promise<Bundle[]> {
  return Promise.all(
    patient.files.map((file) => {
      const load = modules[file]
      if (!load) throw new Error(`Ejemplo no encontrado: ${file}`)
      return load()
    }),
  )
}
