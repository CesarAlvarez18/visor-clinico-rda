import type { EncounterSummary } from '../domain/types'
import { ENCOUNTER_KIND_LABELS, formatDate } from './format'

interface ViewingIndicatorProps {
  encounter: EncounterSummary
}

export function ViewingIndicator({ encounter }: ViewingIndicatorProps) {
  const parts = [ENCOUNTER_KIND_LABELS[encounter.kind], formatDate(encounter.start), encounter.organizationName].filter(Boolean)
  return (
    <p className="viewing" aria-live="polite">
      <span className="viewing__label">Viendo:</span> {parts.join(' · ')}
      {encounter.practitionerName && <span className="viewing__practitioner"> · {encounter.practitionerName}</span>}
    </p>
  )
}
