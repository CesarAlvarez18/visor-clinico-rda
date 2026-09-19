import type {
  Bundle,
  CodeableConcept,
  Composition,
  Condition,
  Encounter,
  EncounterDiagnosis,
  HumanName,
  Observation,
  Organization,
  Patient,
  Practitioner,
} from 'fhir/r4'
import type {
  ClinicalStatus,
  Coded,
  DiagnosisEntry,
  EncounterKind,
  EncounterRecord,
  EncounterSummary,
  PatientSummary,
  Sex,
  TriageSummary,
} from '../domain/types'
import { ageAt } from '../domain/age'
import { BundleIndex } from './references'

export const ICD10_SYSTEM = 'http://hl7.org/fhir/sid/icd-10'
export const TRIAGE_CODE = '225390008' // SNOMED CT "triaje", fijo en ObservationTriageRDA
export const PROBLEMS_SECTION_CODE = '11450-4' // LOINC, sectionProblems
export const DIAGNOSIS_TYPE_EXTENSION = 'https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionDiagnosisType'

const INACTIVE_STATUSES: ReadonlySet<string> = new Set(['inactive', 'resolved', 'remission'])

const KIND_BY_CLASS: Record<string, EncounterKind> = {
  AMB: 'ambulatory',
  EMER: 'emergency',
  IMP: 'hospitalization',
}

/**
 * Convierte un Bundle RDA de atención (ya validado con validateBundle) en el
 * modelo del dominio. Solo lee lo que la silueta necesita: paciente, atención,
 * diagnósticos con su rol y el triage de urgencias.
 */
export function parseBundle(bundle: Bundle): EncounterRecord {
  const index = new BundleIndex(bundle)
  const composition = index.first<Composition>('Composition')
  const patientResource = index.resolve<Patient>(composition?.subject) ?? index.first<Patient>('Patient')
  const encounterResource = index.resolve<Encounter>(composition?.encounter) ?? index.first<Encounter>('Encounter')
  if (!patientResource || !encounterResource) {
    throw new Error('El Bundle no incluye Patient o Encounter.')
  }

  const practitionerName = resolvePractitionerName(index, encounterResource, composition)
  const organizationName = resolveOrganizationName(index, encounterResource, composition)
  const patient = toPatientSummary(patientResource)
  const encounter = toEncounterSummary(encounterResource, index, practitionerName, organizationName)
  const diagnoses = collectDiagnoses(index, encounterResource, composition, encounter, practitionerName, organizationName)

  return {
    patient,
    encounter,
    diagnoses,
    ageAtEncounter: patient.birthDate ? ageAt(patient.birthDate, encounter.start) : undefined,
  }
}

function toPatientSummary(patient: Patient): PatientSummary {
  const official = patient.identifier?.find((i) => i.use === 'official') ?? patient.identifier?.[0]
  const identifierType = official?.type?.coding?.find((c) => c.system?.includes('ColombianPersonIdentifier'))?.code
  return {
    id: patient.id ?? 'sin-id',
    identifier: official?.value,
    identifierType,
    name: formatName(patient.name?.find((n) => n.use === 'official') ?? patient.name?.[0]) || 'Paciente sin nombre',
    birthDate: patient.birthDate,
    sex: toSex(patient.gender),
  }
}

function toSex(gender: Patient['gender']): Sex {
  return gender === 'male' || gender === 'female' || gender === 'other' ? gender : 'unknown'
}

function toEncounterSummary(
  encounter: Encounter,
  index: BundleIndex,
  practitionerName: string | undefined,
  organizationName: string | undefined,
): EncounterSummary {
  return {
    id: encounter.id ?? 'sin-id',
    kind: KIND_BY_CLASS[encounter.class?.code ?? ''] ?? 'unknown',
    start: encounter.period?.start ?? '',
    end: encounter.period?.end,
    practitionerName,
    organizationName,
    triage: findTriage(index),
  }
}

function findTriage(index: BundleIndex): TriageSummary | undefined {
  const observation = index
    .all<Observation>('Observation')
    .find((o) => o.code?.coding?.some((c) => c.code === TRIAGE_CODE))
  const value = firstCoding(observation?.valueCodeableConcept)
  if (!observation || !value) return undefined
  return { ...value, effectiveDateTime: observation.effectiveDateTime }
}

function collectDiagnoses(
  index: BundleIndex,
  encounter: Encounter,
  composition: Composition | undefined,
  summary: EncounterSummary,
  practitionerName: string | undefined,
  organizationName: string | undefined,
): DiagnosisEntry[] {
  const seen = new Set<string>()
  const result: DiagnosisEntry[] = []
  const common = { practitionerName, organizationName, encounterDate: summary.start }

  // 1. Diagnósticos con rol, desde Encounter.diagnosis.
  for (const dx of encounter.diagnosis ?? []) {
    const condition = index.resolve<Condition>(dx.condition)
    if (!condition || condition.resourceType !== 'Condition') continue
    const key = condition.id ?? dx.condition.reference ?? ''
    if (seen.has(key)) continue
    seen.add(key)
    result.push({
      ...toDiagnosisBase(condition),
      role: firstCoding(dx.use),
      rank: dx.rank,
      diagnosisType: readDiagnosisType(dx),
      ...common,
    })
  }

  // 2. Diagnósticos que solo aparecen en sectionProblems (sin rol).
  const problems = composition?.section?.find((s) => s.code?.coding?.some((c) => c.code === PROBLEMS_SECTION_CODE))
  for (const entry of problems?.entry ?? []) {
    const condition = index.resolve<Condition>(entry)
    if (!condition || condition.resourceType !== 'Condition') continue
    const key = condition.id ?? entry.reference ?? ''
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ ...toDiagnosisBase(condition), ...common })
  }

  return result
}

function toDiagnosisBase(condition: Condition): Omit<DiagnosisEntry, 'practitionerName' | 'organizationName' | 'encounterDate'> {
  const coding = condition.code?.coding?.find((c) => c.system === ICD10_SYSTEM) ?? condition.code?.coding?.[0]
  const clinicalStatus = toClinicalStatus(condition.clinicalStatus)
  return {
    conditionId: condition.id ?? 'sin-id',
    code: coding?.code ?? 'sin-codigo',
    codeSystem: coding?.system,
    display: coding?.display ?? condition.code?.text ?? coding?.code ?? 'Diagnóstico sin descripción',
    clinicalStatus,
    isActive: !INACTIVE_STATUSES.has(clinicalStatus),
  }
}

function toClinicalStatus(concept: CodeableConcept | undefined): ClinicalStatus {
  const code = firstCoding(concept)?.code
  switch (code) {
    case 'active':
    case 'recurrence':
    case 'relapse':
    case 'inactive':
    case 'remission':
    case 'resolved':
      return code
    case undefined:
      // La guía fija "active" como valor por defecto.
      return 'active'
    default:
      return 'unknown'
  }
}

function readDiagnosisType(dx: EncounterDiagnosis): Coded | undefined {
  const ext = dx.extension?.find((e) => e.url === DIAGNOSIS_TYPE_EXTENSION)
  if (!ext) return undefined
  // Los ejemplos oficiales usan valueCoding en unos casos y valueCodeableConcept en otros.
  const coding = ext.valueCoding ?? ext.valueCodeableConcept?.coding?.[0]
  return coding?.code ? { code: coding.code, display: coding.display } : undefined
}

function resolvePractitionerName(index: BundleIndex, encounter: Encounter, composition: Composition | undefined): string | undefined {
  const fromParticipant = encounter.participant
    ?.map((p) => index.resolve<Practitioner>(p.individual))
    .find((r) => r?.resourceType === 'Practitioner')
  const fromAuthor = composition?.author?.map((a) => index.resolve<Practitioner>(a)).find((r) => r?.resourceType === 'Practitioner')
  const practitioner = fromParticipant ?? fromAuthor
  return practitioner ? formatName(practitioner.name?.[0]) || undefined : undefined
}

function resolveOrganizationName(index: BundleIndex, encounter: Encounter, composition: Composition | undefined): string | undefined {
  const org =
    index.resolve<Organization>(encounter.serviceProvider) ??
    index.resolve<Organization>(composition?.custodian) ??
    composition?.author?.map((a) => index.resolve<Organization>(a)).find((r) => r?.resourceType === 'Organization')
  return org?.resourceType === 'Organization' ? org.name : undefined
}

function firstCoding(concept: CodeableConcept | undefined): Coded | undefined {
  const coding = concept?.coding?.[0]
  if (coding?.code) return { code: coding.code, display: coding.display ?? concept?.text }
  if (concept?.text) return { code: concept.text, display: concept.text }
  return undefined
}

function formatName(name: HumanName | undefined): string {
  if (!name) return ''
  if (name.text) return name.text
  return [...(name.given ?? []), name.family].filter(Boolean).join(' ')
}
