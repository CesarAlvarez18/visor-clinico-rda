# Códigos de la guía RDA usados por el visor

Verificado el 2026-09-19 contra la guía de implementación RDA v1.0.0 (STU1), FHIR R4:
https://vulcano.ihcecol.gov.co/ (canonical `https://fhir.minsalud.gov.co/rda/ImplementationGuide/minsalud.fhir.co.rda`).

Cada tabla indica la página fuente. Lo marcado **por confirmar** no se pudo leer completo en la guía y debe revisarse antes de depender de ello.

## 1. Rol del diagnóstico en la atención (`Encounter.diagnosis.use`)

- CodeSystem: `https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianDiagnosisRole`
- ValueSet: `https://fhir.minsalud.gov.co/rda/ValueSet/ColombianDiagnosisRoleCodes`
- Fuente: https://vulcano.ihcecol.gov.co/CodeSystem-ColombianDiagnosisRole.html
- Los códigos son SNOMED CT pero el `system` es el CodeSystem propio de la guía.

| Código | Display | Dónde se usa (slice de `Encounter.diagnosis`) |
|---|---|---|
| `8319008` | diagnóstico primario | Ambulatorio: `MainDiagnosis` (rank 1) |
| `398192003` | comorbilidades | Ambulatorio: `Comorbidity-1..3` (rank 2–4). Hospitalización: `DischargeComorbidity-1..3` (rank 3–5) |
| `52870002` | diagnóstico de ingreso | Urgencias y hospitalización: `AdmissionDiagnosis` (rank 1) |
| `89100005` | diagnóstico final (alta) | Urgencias y hospitalización: `DischargeDiagnosis` (rank 2) |
| `16100001` | diagnóstico de la causa de muerte | Hospitalización: `CauseOfDeath` (rank 6) |
| `263718001` | complicación | Hospitalización: `ComplicationDiagnosis` (rank 7) |

Cardinalidades de `Encounter.diagnosis`: ambulatorio 1..4; urgencias 2..5; hospitalización 2..7 (admisión y egreso obligatorios).
Fuentes: `StructureDefinition-EncounterAmbulatoryRDA.html`, `-EncounterEmergencyRDA.html`, `-EncounterHospitalizationRDA.html`.

**Propuesta de nivel por rol (pendiente de validación clínica)**: complicación y causa de muerte → Grave; primario, ingreso y final (alta) → Moderado; comorbilidades → Leve; sin `use` → Leve con "rol no registrado".

## 2. Tipo de diagnóstico (extensión sobre `Encounter.diagnosis`)

- Extensión: `https://fhir.minsalud.gov.co/rda/StructureDefinition/ExtensionDiagnosisType` (valor `Coding`; en el ejemplo ambulatorio aparece como `valueCodeableConcept`, en el de urgencias como `valueCoding`).
- CodeSystem: `https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSTipoDiagnosticoPrincipalVersion2`
- ValueSet: `https://fhir.minsalud.gov.co/rda/ValueSet/RIPSTipoDiagnosticoPrincipalVersion2Codigos`
- Fuente: https://vulcano.ihcecol.gov.co/CodeSystem-RIPSTipoDiagnosticoPrincipalVersion2.html

| Código | Display |
|---|---|
| `01` | Impresión Diagnóstica |
| `02` | Confirmado Nuevo |
| `03` | Confirmado Repetido |

Uso en el visor: se muestra en el panel de trazabilidad; no cambia el nivel en v1.

## 3. Diagnóstico (`ConditionRDA`)

- Perfil: `https://fhir.minsalud.gov.co/rda/StructureDefinition/ConditionRDA`
- `code.coding.system`: `http://hl7.org/fhir/sid/icd-10` (ValueSet ICD 10 Colombia). También admite `http://hl7.org/fhir/sid/icd-11` y enfermedades huérfanas (`https://fhir.minsalud.gov.co/rda/CodeSystem/MipresOrphanDiseases`).
- `clinicalStatus`: `http://terminology.hl7.org/CodeSystem/condition-clinical` (`active` por defecto; también `inactive`, `resolved`, `remission`, `recurrence`, `relapse`).
- `verificationStatus`: fijo `confirmed`.
- **Prohibidos (0..0)**: `severity`, `bodySite`, `encounter`, `onset[x]`, `abatement[x]`, `recordedDate`, `recorder`, `asserter`, `note`.
- Ejemplo: https://vulcano.ihcecol.gov.co/Condition-072d9e24-f388-4a3f-ab82-e8b7a81e4459.json (`A05.9`, formato del código CIE-10 **con punto**).

## 4. Atención (`Encounter`)

| Perfil | `class` (`http://terminology.hl7.org/CodeSystem/v3-ActCode`) | `type` grupo de servicio (`GrupoServicios`) | Participante obligatorio |
|---|---|---|---|
| `EncounterAmbulatoryRDA` | `AMB` | `01` Consulta externa | `AttenderPhysician`, tipo `ATND` |
| `EncounterEmergencyRDA` | `EMER` | `05` Atención inmediata | `DischargePhysician`, tipo `DIS` |
| `EncounterHospitalizationRDA` | `IMP` | `03` Internación | `DischargePhysician`, tipo `DIS` |

- `status` fijo `finished`. `period.start` y `period.end` obligatorios; no pueden ser de hace más de un año ni futuros.
- Tipo de participante: `http://terminology.hl7.org/CodeSystem/v3-ParticipationType`.
- Otros slices de `type`: modalidad `https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianTechModality` (`01` Intramural … `09` Telemonitoreo); entorno `https://fhir.minsalud.gov.co/rda/CodeSystem/EntornoAtencion` (`01` Hogar, `02` Comunitario, `03` Escolar, `04` Laboral, `05` Institucional); en ambulatorio además el servicio REPS `https://fhir.minsalud.gov.co/rda/CodeSystem/REPShealthcareServices` (p. ej. `328` Medicina general) y `serviceType` con CUPS (`https://fhir.minsalud.gov.co/rda/CodeSystem/CUPS`, p. ej. `890201`).
- `reasonCode`: `https://fhir.minsalud.gov.co/rda/CodeSystem/RIPSCausaExternaVersion2` (p. ej. `22` Accidente en el hogar) en urgencias; en consulta externa la finalidad `RIPSFinalidadConsultaVersion2`.
- Identificador: `https://fhir.minsalud.gov.co/rda/NamingSystem/Encounters`.
- En los ejemplos oficiales las referencias son **relativas sin tipo** (`"reference": "CC-80189301"`, `"Condition-0"`, `"4443000277"`); el lector debe resolver tanto `Tipo/id` como `id` a secas y `fullUrl`.
- Ejemplos: `Encounter-85a174ed-f555-4f28-86b4-c40930d1b840.json` (urgencias), `Encounter-5314ede9-e261-4555-aaf6-7c1b4eff3595.json` (ambulatorio), `Encounter-c9873a03-7e38-49e2-bae0-34d06a72471b.json` (hospitalización).

## 5. Triage (`ObservationTriageRDA`, solo urgencias)

- Perfil: `https://fhir.minsalud.gov.co/rda/StructureDefinition/ObservationTriageRDA`
- `code`: fijo SNOMED CT `http://snomed.info/sct` `225390008` "triaje". `status` fijo `final`. `effectiveDateTime` obligatorio. `component` prohibido.
- `valueCodeableConcept`: CodeSystem `https://fhir.minsalud.gov.co/rda/CodeSystem/ClaseTriage`, ValueSet `https://fhir.minsalud.gov.co/rda/ValueSet/ClaseTriageCodigos`.
- Fuente: https://vulcano.ihcecol.gov.co/CodeSystem-ClaseTriage.html

| Código | Display |
|---|---|
| `01` | Triage I |
| `02` | Triage II |
| `03` | Triage III |
| `04` | Triage IV |
| `05` | Triage V |

- Va en la sección `sectionTriage` (LOINC `54094-8`, "Clasificación de triaje") de `CompositionEmergencyRDA`; las composiciones de consulta y hospitalización no tienen esa sección.

## 6. Documento (`Bundle` + `Composition`)

- `Bundle.type` = `document`; primera entrada la `Composition`.
- Perfiles: `BundleAmbulatoryRDA` / `CompositionAmbulatoryRDA`, `BundleEmergencyRDA` / `CompositionEmergencyRDA`, `BundleHospitalizationRDA` / `CompositionHospitalizationRDA`, `BundlePatientStatementRDA` / `CompositionPatientStatementRDA`.
- `Composition.type`: LOINC `60591-5`. `Composition.title` fijo por tipo (p. ej. "RDA Urgencias"). `Composition.encounter` 1..1, `subject` 1..1 (`PatientRDA`), `author` 1..1, `date` 1..1.
- Secciones (leídas del JSON de los perfiles `StructureDefinition-Composition{Ambulatory,Emergency,Hospitalization}RDA.json`). Todas son 1..1 salvo notas aclaratorias (0..1):

| Slice | LOINC | Título | Entradas | Consulta | Urgencias | Hospitalización |
|---|---|---|---|---|---|---|
| `sectionPayers` | `48768-6` | Entidad(es) responsable(s) por el plan de beneficios en salud | Organization (EAPB) o Patient | ✓ | ✓ | ✓ |
| `sectionHistoryOfOccupation` | `74208-0` | Otros datos demográficos | `PatientOccupationAtEncounterRDA` | ✓ | ✓ | ✓ |
| `sectionAttendanceAllowance` | `105583-9` | Datos incapacidad (SIPE) | `AttendanceAllowanceRDA` | ✓ | ✓ | ✓ |
| `sectionMedications` | `10160-0` | Historial de medicamentos | `MedicationRequestRDA` (+ `MedicationAdministrationRDA`) | ✓ | ✓ | ✓ |
| `sectionAllergies` | `48765-2` | Historial de alergias, intolerancias y reacciones adversas | `AllergyIntoleranceRDA` | ✓ | ✓ | ✓ |
| `sectionProblems` | `11450-4` | Historial de diagnósticos de problemas de salud | `ConditionRDA` | ✓ | ✓ | ✓ |
| `sectionTriage` | `54094-8` | Clasificación de triaje | `ObservationTriageRDA` | – | ✓ | – |
| `sectionRiskFactors` | `75492-9` | Factores de riesgo | `RiskFactorRDA` | ✓ | ✓ | ✓ |
| `sectionProceduresHx` | `47519-4` | Historial de procedimientos | `ProcedureRDA` | – | ✓ | ✓ |
| `sectionResults` | `30954-2` | Resultados del uso de las tecnologías en salud | `ProcedureResultRDA` | – | ✓ | ✓ |
| `sectionServiceRequests` | `61146-1` | Órdenes, prescripciones o solicitudes de servicio | ServiceRequest / MedicationRequest | ✓ | ✓ | ✓ |
| `sectionClarificationNotes` | `34109-9` | Notas aclaratorias | `ObservationClarificationNoteRDA` | 0..1 | 0..1 | 0..1 |
| `sectionAddendumDocuments` | `55107-7` | Documentos de soporte | `DocumentReferenceEPIRDA` | ✓ | ✓ | ✓ |

- Nota para los datos sintéticos: todas las secciones obligatorias deben existir en el Bundle; las que el visor no usa pueden ir con `emptyReason` (`http://terminology.hl7.org/CodeSystem/list-empty-reason`, `unavailable`) o con una entrada mínima. El visor solo lee `sectionProblems` y `sectionTriage`, y tolera que las demás falten.

## 7. Paciente (`PatientRDA`)

- Identificador: slice `NationalPersonIdentifier`, `use: official`, `system: https://fhir.minsalud.gov.co/rda/NamingSystem/RNEC`, `type` con dos codings: `http://terminology.hl7.org/CodeSystem/v2-0203` `PN` y `https://fhir.minsalud.gov.co/rda/CodeSystem/ColombianPersonIdentifier` (`CC`, `TI`, `RC`, …).
- Nombre oficial: `use: official`, `family` con extensiones `ExtensionFathersFamilyName` / `ExtensionMothersFamilyName`, `given` 1..2.
- `gender` (AdministrativeGender) + extensión obligatoria `ExtensionBiologicalGender`. `birthDate` obligatorio.
- Extensiones obligatorias adicionales: nacionalidad, etnia, discapacidad; dirección `home` con zona de residencia. En los datos sintéticos se incluyen con valores ficticios mínimos.

## 8. Lo que NO existe en la guía (y afecta al visor)

- **Signos vitales**: ningún perfil de `Observation` para presión arterial, frecuencia cardíaca, SpO₂, temperatura, peso/talla, Glasgow ni dolor. Las `Observation` de la guía son: triage, resultado de procedimiento, nota aclaratoria (`ObservationClarificationNoteRDA`), ocupación (`PatientOccupationAtEncounterRDA`) e incapacidad (`AttendanceAllowanceRDA`).
- **Laboratorios**: solo como `ProcedureResultRDA` (código CUPS del procedimiento, componentes con `valueQuantity`/`valueCodeableConcept`/`valueString`, sin `referenceRange`).
- Ejemplos oficiales completos de `Bundle` RDA de atención: no se encontró uno de consulta, urgencias u hospitalización (solo `Bundle-ObservationClarificationNotes`). Los Bundles sintéticos se arman combinando los ejemplos de `Encounter`, `Condition` y los perfiles.
