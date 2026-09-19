// Genera los Bundles RDA sintéticos de src/data/examples/.
// Uso: node scripts/generate-examples.mjs
//
// Los datos son ficticios (nombres y documentos evidentemente falsos). La
// estructura sigue la guía RDA v1.0.0 (ver docs/reference/rda-codes.md) sin
// pasar por un validador FHIR: las extensiones obligatorias de Patient que el
// visor no usa se omiten, y las secciones de la Composition que no se usan
// van con emptyReason.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'examples')

const RDA = 'https://fhir.minsalud.gov.co/rda'
const SD = `${RDA}/StructureDefinition`
const CS = `${RDA}/CodeSystem`
const LOINC = 'http://loinc.org'
const ICD10 = 'http://hl7.org/fhir/sid/icd-10'
const ACT_CODE = 'http://terminology.hl7.org/CodeSystem/v3-ActCode'
const PARTICIPATION = 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType'
const CONDITION_CLINICAL = 'http://terminology.hl7.org/CodeSystem/condition-clinical'
const CONDITION_VER = 'http://terminology.hl7.org/CodeSystem/condition-ver-status'
const EMPTY_REASON = 'http://terminology.hl7.org/CodeSystem/list-empty-reason'
const BASE_URL = 'https://ejemplo.visor-rda.test/fhir'

// Roles del diagnóstico (ColombianDiagnosisRole)
const ROLE = {
  primary: { code: '8319008', display: 'diagnóstico primario' },
  comorbidity: { code: '398192003', display: 'comorbilidades' },
  discharge: { code: '89100005', display: 'diagnóstico final (alta)' },
  causeOfDeath: { code: '16100001', display: 'diagnóstico de la causa de muerte' },
  admission: { code: '52870002', display: 'diagnóstico de ingreso' },
  complication: { code: '263718001', display: 'complicación' },
}

// Tipo de diagnóstico (RIPSTipoDiagnosticoPrincipalVersion2)
const DX_TYPE = {
  impression: { code: '01', display: 'Impresión Diagnóstica' },
  confirmedNew: { code: '02', display: 'Confirmado Nuevo' },
  confirmedRepeat: { code: '03', display: 'Confirmado Repetido' },
}

const KIND = {
  ambulatory: {
    profileSuffix: 'Ambulatory',
    class: { code: 'AMB', display: 'ambulatory' },
    serviceGroup: { code: '01', display: 'Consulta externa' },
    participant: { id: 'AttenderPhysician', code: 'ATND', display: 'attender' },
    title: 'RDA Consulta',
    sections: ['payers', 'occupation', 'allowance', 'medications', 'allergies', 'problems', 'riskFactors', 'serviceRequests', 'addendum'],
  },
  emergency: {
    profileSuffix: 'Emergency',
    class: { code: 'EMER', display: 'emergency' },
    serviceGroup: { code: '05', display: 'Atención inmediata' },
    participant: { id: 'DischargePhysician', code: 'DIS', display: 'discharger' },
    title: 'RDA Urgencias',
    sections: ['payers', 'occupation', 'allowance', 'medications', 'allergies', 'problems', 'triage', 'riskFactors', 'procedures', 'results', 'serviceRequests', 'addendum'],
  },
  hospitalization: {
    profileSuffix: 'Hospitalization',
    class: { code: 'IMP', display: 'inpatient encounter' },
    serviceGroup: { code: '03', display: 'Internación' },
    participant: { id: 'DischargePhysician', code: 'DIS', display: 'discharger' },
    title: 'RDA Hospitalización',
    sections: ['payers', 'occupation', 'allowance', 'medications', 'allergies', 'problems', 'riskFactors', 'procedures', 'results', 'serviceRequests', 'addendum'],
  },
}

const SECTION = {
  payers: { code: '48768-6', title: 'Entidad(es) responsable(s) por el plan de beneficios en salud' },
  occupation: { code: '74208-0', title: 'Otros datos demográficos' },
  allowance: { code: '105583-9', title: 'Datos incapacidad (SIPE – Sistema de Incapacidades y Prestaciones Economicas)' },
  medications: { code: '10160-0', title: 'Historial de medicamentos' },
  allergies: { code: '48765-2', title: 'Historial de alergias, intolerancias y reacciones adversas' },
  problems: { code: '11450-4', title: 'Historial de diagnósticos de problemas de salud' },
  triage: { code: '54094-8', title: 'Clasificación de triaje' },
  riskFactors: { code: '75492-9', title: 'Factores de riesgo' },
  procedures: { code: '47519-4', title: 'Historial de procedimientos' },
  results: { code: '30954-2', title: 'Resultados del uso de las tecnologías en salud' },
  serviceRequests: { code: '61146-1', title: 'Órdenes, prescripciones o solicitudes de servicio' },
  addendum: { code: '55107-7', title: 'Documentos de soporte' },
}

// --- Actores ficticios -------------------------------------------------

const patients = {
  p1: {
    id: 'pac-999999001',
    document: '999999001',
    given: ['Paciente'],
    family: 'Prueba Uno',
    gender: 'male',
    biologicalSex: { code: '01', display: 'Hombre' },
    birthDate: '1962-04-15',
  },
  p2: {
    id: 'pac-999999002',
    document: '999999002',
    given: ['Paciente'],
    family: 'Prueba Dos',
    gender: 'female',
    biologicalSex: { code: '02', display: 'Mujer' },
    birthDate: '1990-09-30',
  },
  // Copia codificada del caso de demostración UCI-DEMO-042. El caso solo da la
  // edad (58 años): la fecha de nacimiento es aproximada (1 de enero del año
  // que corresponde), no un dato del caso.
  p3: {
    id: 'pac-uci-demo-042',
    document: 'UCI-DEMO-042',
    given: ['Mateo'],
    family: 'Quintero Restrepo',
    gender: 'male',
    biologicalSex: { code: '01', display: 'Hombre' },
    birthDate: '1968-01-01',
  },
}

const practitioners = {
  general: { id: 'prac-999000001', document: '999000001', given: ['Médica'], family: 'General Ejemplo' },
  urgencias: { id: 'prac-999000002', document: '999000002', given: ['Médico'], family: 'Urgencias Ejemplo' },
  internista: { id: 'prac-999000003', document: '999000003', given: ['Médica'], family: 'Internista Ejemplo' },
}

const organizations = {
  ips: { id: 'org-990000001', nit: '990000001', name: 'IPS Consulta Ejemplo' },
  hospital: { id: 'org-990000002', nit: '990000002', name: 'Hospital San Ejemplo' },
  clinicaNorte: { id: 'org-990000003', nit: '990000003', name: 'Clínica Ficticia del Norte' },
  eapb: { id: 'org-eapb-990000009', nit: '990000009', name: 'EAPB Ejemplo' },
}

// --- Constructores de recursos ------------------------------------------

function ref(type, id) {
  return { reference: `${type}/${id}` }
}

function entry(resource) {
  return { fullUrl: `${BASE_URL}/${resource.resourceType}/${resource.id}`, resource }
}

function buildPatient(p) {
  return {
    resourceType: 'Patient',
    id: p.id,
    meta: { profile: [`${SD}/PatientRDA`] },
    extension: [
      {
        url: `${SD}/ExtensionBiologicalGender`,
        valueCoding: { system: `${CS}/ColombianGenderGroup`, ...p.biologicalSex },
      },
    ],
    identifier: [
      {
        use: 'official',
        type: {
          coding: [
            { system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'PN' },
            { system: `${CS}/ColombianPersonIdentifier`, code: 'CC', display: 'Cédula de ciudadanía' },
          ],
        },
        system: `${RDA}/NamingSystem/RNEC`,
        value: p.document,
      },
    ],
    name: [{ use: 'official', family: p.family, given: p.given }],
    gender: p.gender,
    birthDate: p.birthDate,
    address: [{ use: 'home', type: 'physical', city: 'Medellín', country: 'Colombia' }],
  }
}

function buildPractitioner(pr) {
  return {
    resourceType: 'Practitioner',
    id: pr.id,
    meta: { profile: [`${SD}/PractitionerRDA`] },
    identifier: [{ use: 'official', system: `${RDA}/NamingSystem/RNEC`, value: pr.document }],
    name: [{ use: 'official', family: pr.family, given: pr.given }],
  }
}

function buildOrganization(o, profile) {
  return {
    resourceType: 'Organization',
    id: o.id,
    meta: { profile: [`${SD}/${profile}`] },
    identifier: [{ use: 'official', system: `${RDA}/NamingSystem/NIT`, value: o.nit }],
    name: o.name,
  }
}

function buildCondition({ id, code, display, clinicalStatus = 'active' }, patient) {
  const statusDisplay = { active: 'Active', resolved: 'Resolved', inactive: 'Inactive', remission: 'Remission' }[clinicalStatus]
  return {
    resourceType: 'Condition',
    id,
    meta: { profile: [`${SD}/ConditionRDA`] },
    clinicalStatus: { coding: [{ system: CONDITION_CLINICAL, code: clinicalStatus, display: statusDisplay }] },
    verificationStatus: { coding: [{ system: CONDITION_VER, code: 'confirmed', display: 'Confirmed' }] },
    code: { coding: [{ system: ICD10, code, display }] },
    subject: ref('Patient', patient.id),
  }
}

function buildTriage({ id, code, display, effective }, patient, encounterId, practitioner) {
  return {
    resourceType: 'Observation',
    id,
    meta: { profile: [`${SD}/ObservationTriageRDA`] },
    status: 'final',
    code: { coding: [{ system: 'http://snomed.info/sct', code: '225390008', display: 'triaje' }], text: 'Triage' },
    subject: ref('Patient', patient.id),
    encounter: ref('Encounter', encounterId),
    effectiveDateTime: effective,
    performer: [ref('Practitioner', practitioner.id)],
    valueCodeableConcept: { coding: [{ system: `${CS}/ClaseTriage`, code, display }] },
  }
}

function buildEncounter(enc, kind, patient, practitioner, organization) {
  const diagnosis = enc.diagnoses
    .filter((d) => d.role)
    .map((d) => ({
      id: d.sliceId,
      extension: [
        {
          url: `${SD}/ExtensionDiagnosisType`,
          valueCoding: { system: `${CS}/RIPSTipoDiagnosticoPrincipalVersion2`, ...(d.type ?? DX_TYPE.confirmedNew) },
        },
      ],
      condition: ref('Condition', d.id),
      use: { coding: [{ system: `${CS}/ColombianDiagnosisRole`, ...ROLE[d.role] }] },
      rank: d.rank,
    }))

  const encounter = {
    resourceType: 'Encounter',
    id: enc.id,
    meta: { profile: [`${SD}/Encounter${kind.profileSuffix}RDA`] },
    identifier: [{ use: 'usual', system: `${RDA}/NamingSystem/Encounters`, value: enc.identifier }],
    status: enc.status ?? 'finished',
    class: { system: ACT_CODE, ...kind.class },
    type: [
      { coding: [{ system: `${CS}/ColombianTechModality`, code: '01', display: 'Intramural' }] },
      { coding: [{ system: `${CS}/GrupoServicios`, ...kind.serviceGroup }] },
      { coding: [{ system: `${CS}/EntornoAtencion`, code: '05', display: 'Institucional' }] },
    ],
    subject: ref('Patient', patient.id),
    // Sin profesional identificado (atención en curso) no hay participante.
    participant: practitioner && [
      {
        id: kind.participant.id,
        type: [{ coding: [{ system: PARTICIPATION, code: kind.participant.code, display: kind.participant.display }] }],
        individual: ref('Practitioner', practitioner.id),
      },
    ],
    period: { start: enc.start, end: enc.end },
    diagnosis,
    serviceProvider: ref('Organization', organization.id),
  }
  if (enc.reason) encounter.reasonCode = [enc.reason]
  if (enc.hospitalization) encounter.hospitalization = enc.hospitalization
  return encounter
}

function buildComposition(enc, kind, patient, practitioner, organization, conditionIds, triageId) {
  const sections = kind.sections.map((key) => {
    const s = SECTION[key]
    const section = { title: s.title, code: { coding: [{ system: LOINC, code: s.code }] } }
    if (key === 'problems') {
      section.entry = conditionIds.map((id) => ref('Condition', id))
    } else if (key === 'triage' && triageId) {
      section.entry = [ref('Observation', triageId)]
    } else if (key === 'payers') {
      section.entry = [ref('Organization', organizations.eapb.id)]
    } else {
      section.emptyReason = { coding: [{ system: EMPTY_REASON, code: 'unavailable', display: 'Unavailable' }] }
    }
    return section
  })
  return {
    resourceType: 'Composition',
    id: `comp-${enc.id}`,
    meta: { profile: [`${SD}/Composition${kind.profileSuffix}RDA`] },
    status: enc.status === 'in-progress' ? 'preliminary' : 'final',
    type: { coding: [{ system: LOINC, code: '60591-5', display: 'Patient summary Document' }] },
    subject: ref('Patient', patient.id),
    encounter: ref('Encounter', enc.id),
    date: enc.end ?? enc.documentDate,
    author: [practitioner ? ref('Practitioner', practitioner.id) : ref('Organization', organization.id)],
    title: kind.title,
    custodian: ref('Organization', organization.id),
    section: sections,
  }
}

function buildBundle(enc) {
  const kind = KIND[enc.kind]
  const patient = patients[enc.patient]
  const practitioner = practitioners[enc.practitioner]
  const organization = organizations[enc.organization]
  const conditions = enc.diagnoses.map((d) => buildCondition(d, patient))
  const triage = enc.triage ? buildTriage(enc.triage, patient, enc.id, practitioner) : undefined
  const composition = buildComposition(enc, kind, patient, practitioner, organization, conditions.map((c) => c.id), triage?.id)
  const encounter = buildEncounter(enc, kind, patient, practitioner, organization)

  const resources = [
    composition,
    buildPatient(patient),
    encounter,
    ...(practitioner ? [buildPractitioner(practitioner)] : []),
    buildOrganization(organization, 'CareDeliveryOrganizationRDA'),
    buildOrganization(organizations.eapb, 'HealthBenefitPlanAdminOrganizationRDA'),
    ...conditions,
    ...(triage ? [triage] : []),
  ]

  return {
    resourceType: 'Bundle',
    id: `bundle-${enc.id}`,
    meta: { profile: [`${SD}/Bundle${kind.profileSuffix}RDA`] },
    identifier: { system: `${RDA}/NamingSystem/RDA`, value: enc.identifier },
    type: 'document',
    timestamp: enc.end ?? enc.documentDate,
    entry: resources.map(entry),
  }
}

// --- Historia del paciente 1 ---------------------------------------------
// Hombre de 64 años: hipertensión conocida, infarto en marzo de 2026 con
// hospitalización, neumonía como complicación, y control en agosto.

const encounters = [
  {
    file: 'paciente-01/consulta-2025-11-03.json',
    id: 'enc-p1-2025-11-03',
    identifier: 'RDA-P1-0001',
    kind: 'ambulatory',
    patient: 'p1',
    practitioner: 'general',
    organization: 'ips',
    start: '2025-11-03T08:30:00-05:00',
    end: '2025-11-03T09:00:00-05:00',
    // Un solo diagnóstico: flujo "información incompleta" (CA-4)
    diagnoses: [
      { sliceId: 'MainDiagnosis', id: 'cond-p1-i10-2025', code: 'I10', display: 'Hipertensión esencial (primaria)', role: 'primary', rank: 1, type: DX_TYPE.confirmedRepeat },
    ],
  },
  {
    file: 'paciente-01/urgencias-2026-03-14.json',
    id: 'enc-p1-2026-03-14',
    identifier: 'RDA-P1-0002',
    kind: 'emergency',
    patient: 'p1',
    practitioner: 'urgencias',
    organization: 'hospital',
    start: '2026-03-14T22:10:00-05:00',
    end: '2026-03-15T02:40:00-05:00',
    reason: { coding: [{ system: `${CS}/RIPSCausaExternaVersion2`, code: '38', display: 'ENFERMEDAD GENERAL' }] },
    // Triage II y diagnóstico de ingreso grave (CA-10, tabla minLevel CA-7)
    triage: { id: 'obs-p1-triage-2026-03-14', code: '02', display: 'Triage II', effective: '2026-03-14T22:15:00-05:00' },
    diagnoses: [
      { sliceId: 'AdmissionDiagnosis', id: 'cond-p1-i21-adm', code: 'I21.0', display: 'Infarto transmural agudo del miocardio de la pared anterior', role: 'admission', rank: 1, type: DX_TYPE.impression },
      { sliceId: 'DischargeDiagnosis', id: 'cond-p1-i21-dis', code: 'I21.0', display: 'Infarto transmural agudo del miocardio de la pared anterior', role: 'discharge', rank: 2, type: DX_TYPE.confirmedNew },
      { sliceId: 'DischargeComorbidity-1', id: 'cond-p1-i10-urg', code: 'I10', display: 'Hipertensión esencial (primaria)', role: 'comorbidity', rank: 3, type: DX_TYPE.confirmedRepeat },
    ],
    hospitalization: {
      admitSource: { coding: [{ system: `${CS}/ViaIngreso`, code: '01', display: 'DEMANDA ESPONTANEA' }] },
      dischargeDisposition: { coding: [{ system: `${CS}/CondicionyDestinoUsuarioEgreso`, code: '02', display: 'HOSPITALIZACION' }] },
    },
  },
  {
    file: 'paciente-01/hospitalizacion-2026-03-15.json',
    id: 'enc-p1-2026-03-15',
    identifier: 'RDA-P1-0003',
    kind: 'hospitalization',
    patient: 'p1',
    practitioner: 'internista',
    organization: 'hospital',
    start: '2026-03-15T03:00:00-05:00',
    end: '2026-03-22T11:00:00-05:00',
    reason: { coding: [{ system: `${CS}/RIPSCausaExternaVersion2`, code: '38', display: 'ENFERMEDAD GENERAL' }] },
    // Respiratorio: comorbilidad (Leve) + complicación (Grave) → Grave (CA-5).
    // Gastritis resuelta: no cuenta pero se lista (CA-8).
    diagnoses: [
      { sliceId: 'AdmissionDiagnosis', id: 'cond-p1-i21-hosp-adm', code: 'I21.0', display: 'Infarto transmural agudo del miocardio de la pared anterior', role: 'admission', rank: 1, type: DX_TYPE.confirmedRepeat },
      { sliceId: 'DischargeDiagnosis', id: 'cond-p1-i25-hosp-dis', code: 'I25.2', display: 'Infarto antiguo del miocardio', role: 'discharge', rank: 2, type: DX_TYPE.confirmedNew },
      { sliceId: 'DischargeComorbidity-1', id: 'cond-p1-j44-hosp', code: 'J44.9', display: 'Enfermedad pulmonar obstructiva crónica, no especificada', role: 'comorbidity', rank: 3, type: DX_TYPE.confirmedNew },
      { sliceId: 'DischargeComorbidity-2', id: 'cond-p1-e11-hosp', code: 'E11.9', display: 'Diabetes mellitus no insulinodependiente, sin mención de complicación', role: 'comorbidity', rank: 4, type: DX_TYPE.confirmedNew },
      { sliceId: 'DischargeComorbidity-3', id: 'cond-p1-k29-hosp', code: 'K29.7', display: 'Gastritis, no especificada', role: 'comorbidity', rank: 5, type: DX_TYPE.confirmedNew, clinicalStatus: 'resolved' },
      { sliceId: 'ComplicationDiagnosis', id: 'cond-p1-j18-hosp', code: 'J18.9', display: 'Neumonía, no especificada', role: 'complication', rank: 7, type: DX_TYPE.confirmedNew },
    ],
    hospitalization: {
      admitSource: { coding: [{ system: `${CS}/ViaIngreso`, code: '02', display: 'REMITIDO' }] },
      dischargeDisposition: { coding: [{ system: `${CS}/CondicionyDestinoUsuarioEgreso`, code: '01', display: 'ALTA MEDICA' }] },
    },
  },
  {
    file: 'paciente-01/consulta-2026-08-20.json',
    id: 'enc-p1-2026-08-20',
    identifier: 'RDA-P1-0004',
    kind: 'ambulatory',
    patient: 'p1',
    practitioner: 'general',
    organization: 'ips',
    start: '2026-08-20T10:00:00-05:00',
    end: '2026-08-20T10:40:00-05:00',
    // Z00.0 sin mapeo a sistema (CA-9). F32.1 solo en la sección, sin rol (CA-6).
    diagnoses: [
      { sliceId: 'MainDiagnosis', id: 'cond-p1-i25-ctrl', code: 'I25.2', display: 'Infarto antiguo del miocardio', role: 'primary', rank: 1, type: DX_TYPE.confirmedRepeat },
      { sliceId: 'Comorbidity-1', id: 'cond-p1-e11-ctrl', code: 'E11.9', display: 'Diabetes mellitus no insulinodependiente, sin mención de complicación', role: 'comorbidity', rank: 2, type: DX_TYPE.confirmedRepeat },
      { sliceId: 'Comorbidity-2', id: 'cond-p1-z00-ctrl', code: 'Z00.0', display: 'Examen médico general', role: 'comorbidity', rank: 3, type: DX_TYPE.confirmedNew },
      { id: 'cond-p1-f32-ctrl', code: 'F32.1', display: 'Episodio depresivo moderado', type: DX_TYPE.impression },
    ],
  },
  // Paciente 3: copia codificada del caso de demostración UCI-DEMO-042 (choque
  // séptico por neumonía neumocócica, día 2 de UCI). El original traía los
  // diagnósticos solo como texto y sin Encounter.diagnosis, y el visor lo
  // mostraba todo en "Sin datos". CIE-10 y roles asignados para el prototipo,
  // PENDIENTES DE VALIDACIÓN CLÍNICA. Sigue hospitalizado: atención
  // "in-progress", sin egreso ni profesional identificado. Medicamentos,
  // laboratorios, procedimientos y alergia del original no se copian: el visor
  // v1 no los lee y venían sin CUPS/CUM.
  {
    file: 'paciente-03/hospitalizacion-uci-2026-09-12.json',
    id: 'enc-p3-2026-09-12',
    identifier: 'RDA-HOSP-UCI-DEMO-042',
    kind: 'hospitalization',
    status: 'in-progress',
    patient: 'p3',
    organization: 'clinicaNorte',
    start: '2026-09-12T03:40:00-05:00',
    documentDate: '2026-09-13T18:00:00-05:00',
    diagnoses: [
      { sliceId: 'AdmissionDiagnosis', id: 'cond-p3-j13', code: 'J13', display: 'Neumonía debida a Streptococcus pneumoniae', role: 'admission', rank: 1, type: DX_TYPE.confirmedNew },
      { sliceId: 'ComplicationDiagnosis-1', id: 'cond-p3-a403', code: 'A40.3', display: 'Septicemia debida a Streptococcus pneumoniae', role: 'complication', rank: 2, type: DX_TYPE.confirmedNew },
      { sliceId: 'ComplicationDiagnosis-2', id: 'cond-p3-j80', code: 'J80', display: 'Síndrome de dificultad respiratoria del adulto', role: 'complication', rank: 3, type: DX_TYPE.confirmedNew },
      { sliceId: 'ComplicationDiagnosis-3', id: 'cond-p3-n179', code: 'N17.9', display: 'Insuficiencia renal aguda, no especificada', role: 'complication', rank: 4, type: DX_TYPE.confirmedNew },
      { sliceId: 'Comorbidity-1', id: 'cond-p3-e119', code: 'E11.9', display: 'Diabetes mellitus no insulinodependiente, sin mención de complicación', role: 'comorbidity', rank: 5, type: DX_TYPE.confirmedRepeat },
      // "Trombocitopenia en estudio": solo en la sección, sin rol.
      { id: 'cond-p3-d696', code: 'D69.6', display: 'Trombocitopenia no especificada', type: DX_TYPE.impression },
    ],
    hospitalization: {
      admitSource: { coding: [{ system: `${CS}/ViaIngreso`, code: '03', display: 'DERIVADO DE URGENCIAS' }] },
    },
  },
  // Paciente distinto, para la prueba de "no mezclar pacientes" (CA-3)
  {
    file: 'paciente-02/consulta-2026-05-02.json',
    id: 'enc-p2-2026-05-02',
    identifier: 'RDA-P2-0001',
    kind: 'ambulatory',
    patient: 'p2',
    practitioner: 'general',
    organization: 'ips',
    start: '2026-05-02T14:00:00-05:00',
    end: '2026-05-02T14:20:00-05:00',
    diagnoses: [
      { sliceId: 'MainDiagnosis', id: 'cond-p2-j06', code: 'J06.9', display: 'Infección aguda de las vías respiratorias superiores, no especificada', role: 'primary', rank: 1, type: DX_TYPE.confirmedNew },
    ],
  },
]

// Archivo que no es un documento RDA (CA-2)
const invalid = {
  resourceType: 'Bundle',
  id: 'bundle-invalido',
  type: 'collection',
  entry: [{ resource: { resourceType: 'Patient', id: 'pac-sin-documento' } }],
}

for (const enc of encounters) {
  const path = join(OUT, enc.file)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(buildBundle(enc), null, 2) + '\n')
  console.log('escrito', enc.file)
}
writeFileSync(join(OUT, 'invalido.json'), JSON.stringify(invalid, null, 2) + '\n')
console.log('escrito invalido.json')
