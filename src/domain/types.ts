// Modelo del dominio del visor: lo que la interfaz y las reglas necesitan,
// ya extraído de los recursos FHIR del RDA.

export type EncounterKind = 'ambulatory' | 'emergency' | 'hospitalization' | 'unknown'

export type Sex = 'male' | 'female' | 'other' | 'unknown'

export interface Coded {
  code: string
  display?: string
}

export interface PatientSummary {
  id: string
  /** Número de documento (Patient.identifier.value), usado para no mezclar pacientes. */
  identifier?: string
  identifierType?: string
  name: string
  birthDate?: string
  sex: Sex
}

export interface TriageSummary extends Coded {
  effectiveDateTime?: string
}

export interface EncounterSummary {
  id: string
  kind: EncounterKind
  /** Encounter.period.start (ISO 8601). */
  start: string
  end?: string
  /** Organización que prestó la atención (Encounter.serviceProvider). */
  organizationName?: string
  /** Profesional que atendió o dio el alta (Encounter.participant). */
  practitionerName?: string
  triage?: TriageSummary
}

export type ClinicalStatus =
  | 'active'
  | 'recurrence'
  | 'relapse'
  | 'inactive'
  | 'remission'
  | 'resolved'
  | 'unknown'

export interface DiagnosisEntry {
  conditionId: string
  code: string
  codeSystem?: string
  display: string
  clinicalStatus: ClinicalStatus
  /** false si clinicalStatus es inactive, resolved o remission. */
  isActive: boolean
  /** Rol en la atención (Encounter.diagnosis.use). Ausente si el Condition solo está en la sección. */
  role?: Coded
  rank?: number
  /** Tipo de diagnóstico (ExtensionDiagnosisType): impresión, confirmado nuevo, confirmado repetido. */
  diagnosisType?: Coded
  practitionerName?: string
  organizationName?: string
  /** Fecha de la atención en la que se registró (el RDA no permite fechas propias del diagnóstico). */
  encounterDate: string
}

/** Todo lo que el visor extrae de un Bundle RDA de atención. */
export interface EncounterRecord {
  patient: PatientSummary
  encounter: EncounterSummary
  diagnoses: DiagnosisEntry[]
  /** Edad del paciente en la fecha de la atención, si se conoce la fecha de nacimiento. */
  ageAtEncounter?: number
}
