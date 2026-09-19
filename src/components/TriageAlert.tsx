import type { EncounterKind, TriageSummary } from '../domain/types'

interface TriageAlertProps {
  triage?: TriageSummary
  encounterKind: EncounterKind
}

// Descripción corta de cada clase de triage (Resolución 5596 de 2015). Solo
// texto de apoyo: la clasificación viene del RDA.
const TRIAGE_DESCRIPTION: Record<string, string> = {
  '01': 'Atención inmediata',
  '02': 'Emergencia',
  '03': 'Urgencia',
  '04': 'Prioritario',
  '05': 'No urgente',
}

export function TriageAlert({ triage, encounterKind }: TriageAlertProps) {
  if (!triage) return null
  const label = triage.display ?? `Triage ${triage.code}`
  const description = TRIAGE_DESCRIPTION[triage.code]

  return (
    <div className={`triage triage--${triage.code}`} role="status" aria-label={`Clasificación de triage: ${label}`}>
      <span className="triage__label">{label}</span>
      {description && <span className="triage__description">{description}</span>}
      {encounterKind !== 'emergency' && <span className="triage__note">Triage registrado en una atención que no es de urgencias</span>}
    </div>
  )
}
