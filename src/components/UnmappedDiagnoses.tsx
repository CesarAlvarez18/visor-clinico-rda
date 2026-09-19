import type { DiagnosisEntry } from '../domain/types'

interface UnmappedDiagnosesProps {
  diagnoses: DiagnosisEntry[]
}

/** Diagnósticos cuyo código CIE-10 no está en el mapeo: no colorean la silueta, pero no se pierden. */
export function UnmappedDiagnoses({ diagnoses }: UnmappedDiagnosesProps) {
  if (diagnoses.length === 0) return null
  return (
    <section className="unmapped" aria-labelledby="unmapped-title">
      <h2 id="unmapped-title">Diagnósticos sin sistema asignado</h2>
      <p className="unmapped__hint">Estos códigos no están en la tabla CIE-10 → sistema y no afectan la silueta.</p>
      <ul>
        {diagnoses.map((d) => (
          <li key={d.conditionId}>
            <code>{d.code}</code> {d.display}
            {d.role?.display && <span className="unmapped__role"> · {d.role.display}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
