import type { PatientSummary } from '../domain/types'
import { SEX_LABELS, formatDate } from './format'

interface PatientHeaderProps {
  patient: PatientSummary
  ageAtEncounter?: number
  onReset: () => void
}

export function PatientHeader({ patient, ageAtEncounter, onReset }: PatientHeaderProps) {
  const age = ageAtEncounter !== undefined ? `${ageAtEncounter} años` : 'edad no disponible'
  const identifier = patient.identifier ? `${patient.identifierType ?? 'Doc.'} ${patient.identifier}` : 'sin identificación'

  return (
    <header className="patient-header">
      <div>
        <h1 className="patient-header__name">{patient.name}</h1>
        <p className="patient-header__meta">
          <span>{age}</span>
          <span aria-hidden="true"> · </span>
          <span>{SEX_LABELS[patient.sex]}</span>
          <span aria-hidden="true"> · </span>
          <span>{identifier}</span>
          {patient.birthDate && (
            <>
              <span aria-hidden="true"> · </span>
              <span>Nacimiento: {formatDate(patient.birthDate)}</span>
            </>
          )}
        </p>
      </div>
      <button type="button" className="button-secondary patient-header__reset" onClick={onReset}>
        Cargar otro paciente
      </button>
    </header>
  )
}
