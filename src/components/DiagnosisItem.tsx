import { LEVEL_LABELS } from '../rules/levels'
import type { Evidence } from '../rules/types'
import { CLINICAL_STATUS_LABELS, formatDate } from './format'

interface DiagnosisItemProps {
  evidence: Evidence
  isCause: boolean
}

export function DiagnosisItem({ evidence, isCause }: DiagnosisItemProps) {
  const { diagnosis, contributedLevel, reason } = evidence
  const inactive = contributedLevel === null
  const levelText = inactive ? 'No cuenta para el nivel' : `Aporta: ${LEVEL_LABELS[contributedLevel]}`
  const roleText = diagnosis.role?.display ?? diagnosis.role?.code ?? 'rol no registrado'

  return (
    <li
      className={`diagnosis${isCause ? ' diagnosis--cause' : ''}${inactive ? ' diagnosis--inactive' : ''}`}
      data-condition={diagnosis.conditionId}
    >
      <div className="diagnosis__title">
        <code className="diagnosis__code">{diagnosis.code}</code>
        <span className="diagnosis__display">{diagnosis.display}</span>
        {isCause && <span className="diagnosis__cause-tag">Determina el nivel</span>}
      </div>
      <dl className="diagnosis__details">
        <div>
          <dt>Rol en la atención</dt>
          <dd>{roleText}{diagnosis.rank !== undefined && ` (orden ${diagnosis.rank})`}</dd>
        </div>
        <div>
          <dt>Nivel</dt>
          <dd className={inactive ? undefined : `level-text level-text--${contributedLevel}`}>
            {levelText} · {reason}
          </dd>
        </div>
        <div>
          <dt>Estado clínico</dt>
          <dd>{CLINICAL_STATUS_LABELS[diagnosis.clinicalStatus]}</dd>
        </div>
        {diagnosis.diagnosisType && (
          <div>
            <dt>Tipo de diagnóstico</dt>
            <dd>{diagnosis.diagnosisType.display ?? diagnosis.diagnosisType.code}</dd>
          </div>
        )}
        <div>
          <dt>Registrado</dt>
          <dd>en la atención del {formatDate(diagnosis.encounterDate)}</dd>
        </div>
        {(diagnosis.practitionerName || diagnosis.organizationName) && (
          <div>
            <dt>Origen</dt>
            <dd>{[diagnosis.practitionerName, diagnosis.organizationName].filter(Boolean).join(' · ')}</dd>
          </div>
        )}
      </dl>
    </li>
  )
}
