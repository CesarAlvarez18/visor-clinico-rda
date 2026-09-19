import { useId, useRef } from 'react'
import { examplePatients, type ExamplePatient } from '../data/examples'

interface BundleLoaderProps {
  loading: boolean
  error?: string
  onLoadFiles: (files: File[]) => void
  onLoadExample: (patient: ExamplePatient) => void
}

export function BundleLoader({ loading, error, onLoadFiles, onLoadExample }: BundleLoaderProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <section className="loader" aria-labelledby="loader-title">
      <h2 id="loader-title">Cargar historia clínica (RDA)</h2>
      <p className="loader__hint">
        Seleccione uno o varios documentos RDA en formato JSON de un mismo paciente. Cada archivo es una atención. Solo use
        datos sintéticos.
      </p>

      <div className="loader__files">
        <label htmlFor={inputId} className="loader__label">
          Archivos RDA (JSON)
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          multiple
          disabled={loading}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            if (files.length > 0) onLoadFiles(files)
            if (inputRef.current) inputRef.current.value = ''
          }}
        />
      </div>

      <div className="loader__examples">
        <h3>O use un paciente de ejemplo</h3>
        <ul>
          {examplePatients.map((patient) => (
            <li key={patient.id}>
              <button type="button" className="button-primary" disabled={loading} onClick={() => onLoadExample(patient)}>
                {patient.label}
              </button>
              <span className="loader__description">{patient.description}</span>
            </li>
          ))}
        </ul>
      </div>

      {loading && (
        <p className="loader__status" role="status">
          Leyendo documentos…
        </p>
      )}
      {error && (
        <p className="loader__error" role="alert">
          No se pudo cargar la historia: {error}
        </p>
      )}
    </section>
  )
}
