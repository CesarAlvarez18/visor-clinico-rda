import { useId } from 'react'
import type { EncounterRecord } from '../domain/types'
import { ENCOUNTER_KIND_LABELS, formatIsoDate } from './format'

interface EncounterSelectorProps {
  /** Atenciones ya ordenadas de la más reciente a la más antigua. */
  encounters: EncounterRecord[]
  selectedId: string
  onSelect: (encounterId: string) => void
}

function encounterOptionLabel(record: EncounterRecord): string {
  const { encounter } = record
  return [ENCOUNTER_KIND_LABELS[encounter.kind], formatIsoDate(encounter.start), encounter.organizationName]
    .filter(Boolean)
    .join(' · ')
}

export function EncounterSelector({ encounters, selectedId, onSelect }: EncounterSelectorProps) {
  const id = useId()
  const single = encounters.length === 1

  return (
    <div className="encounter-selector">
      <label htmlFor={id}>Atención</label>
      <select id={id} value={selectedId} disabled={single} onChange={(event) => onSelect(event.target.value)}>
        {encounters.map((record) => (
          <option key={record.encounter.id} value={record.encounter.id}>
            {encounterOptionLabel(record)}
          </option>
        ))}
      </select>
      {single ? (
        <span className="encounter-selector__hint">Única atención cargada</span>
      ) : (
        <span className="encounter-selector__hint">{encounters.length} atenciones, de la más reciente a la más antigua</span>
      )}
    </div>
  )
}
