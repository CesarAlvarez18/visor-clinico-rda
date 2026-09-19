# Plan: Silueta del cuerpo interactiva

- Fecha: 2026-09-19
- Estado: aprobado
- Spec: [docs/specs/2026-09-19-silueta-cuerpo.md](../specs/2026-09-19-silueta-cuerpo.md)

## 1. Objetivo

Al terminar, el médico podrá cargar uno o varios Bundles RDA sintéticos de un paciente y ver una silueta del cuerpo con los doce sistemas corporales coloreados según su nivel de afectación en la atención elegida, con tooltip al pasar el cursor, panel de trazabilidad al hacer clic, selector de atención y alerta de triage en urgencias. Todo corre en el navegador, sin backend.

## 2. Contexto del problema

El médico hoy arma mentalmente el cuadro del paciente leyendo diagnósticos atención por atención. El RDA (Res. 1888 de 2025) entrega esa información estructurada: un `Bundle` de tipo documento por atención, con `Composition`, `Patient`, `Encounter` (con `diagnosis.use` y `rank`), `Condition` (CIE-10, `clinicalStatus`), `Practitioner`, `Organization` y, en urgencias, `Observation` de triage.

Contexto técnico:
- **El repositorio está vacío** salvo `CLAUDE.md`, los skills y `docs/`. No hay código que reutilizar.
- **Stack decidido**: React + TypeScript + Vite, todo en el navegador. Tipos FHIR con `@types/fhir`. Pruebas con Vitest y Testing Library. Silueta en SVG propio.
- **Capas**: `src/fhir/` (lectura de Bundles), `src/rules/` (mapeos y cálculo de nivel como funciones puras), `src/components/` (silueta, panel, selector, encabezado), `src/state/` (estado de la aplicación), `public/examples/` o `src/data/examples/` (Bundles sintéticos).
- **Restricciones de la guía RDA v1.0.0**: sin signos vitales; `ConditionRDA` sin `severity`, `onset`, `abatement`. El nivel se infiere del rol del diagnóstico y la vigencia del Bundle de la atención.
- **Restricciones del proyecto**: solo lectura; solo datos sintéticos; color + texto; español en la interfaz, inglés en el código; nombres FHIR tal cual.

## 3. Spec de referencia

- [docs/specs/2026-09-19-silueta-cuerpo.md](../specs/2026-09-19-silueta-cuerpo.md)
- Criterios de aceptación cubiertos: **CA-1 a CA-20** (numerados en el spec).
- Fuera de alcance (del spec): signos vitales, laboratorios y otras `Observation` distintas del triage; medicamentos, alergias, procedimientos, vacunación y antecedentes; gráficos de tendencia; comparación de dos atenciones; arrastre de diagnósticos entre atenciones; vista posterior; autenticación, auditoría, IHCE o servidor FHIR; validación formal con validador FHIR.

## 4. Tareas

### Tarea 1 — Crear el proyecto
- **Qué**: proyecto React + TypeScript con Vite, ESLint, Vitest + Testing Library, `@types/fhir`, y la estructura de carpetas de las capas. Registrar los comandos en `CLAUDE.md`.
- **Por qué**: habilita todo lo demás. Decisión de stack registrada en `CLAUDE.md`.
- **Archivos**: `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, carpetas `src/fhir/`, `src/rules/`, `src/components/`, `src/state/`, `src/data/examples/`, `.gitignore`, `CLAUDE.md` (sección Comandos).
- **Detalles**: `npm create vite@latest . -- --template react-ts`; agregar `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@types/fhir`. Configurar `test.environment = 'jsdom'` en Vite. Título de la página y `lang="es"`. Inicializar git (`git init`) si el usuario lo aprueba.
- **Depende de**: ninguna.
- **Verificación**: `npm run dev` levanta la página; `npm run build`, `npm run lint` y `npm test` pasan con una prueba trivial.
- [x] Hecha (2026-09-19; la plantilla actual de Vite usa oxlint en lugar de ESLint, se mantuvo; Vitest 5 por compatibilidad con Vite 8)

### Tarea 2 — Verificar en la guía los códigos de rol y tipo de diagnóstico
- **Qué**: consultar en https://vulcano.ihcecol.gov.co/ los CodeSystems/ValueSets exactos de `Encounter.diagnosis.use`, de `ExtensionDiagnosisType`, de `Encounter.type` (modalidad, grupo de servicio) y de `ClaseTriage`, y anotarlos en `docs/reference/rda-codes.md`.
- **Por qué**: el spec deja como pregunta abierta los códigos de `use`; los datos sintéticos (Tarea 3) y la tabla rol → nivel (Tarea 5) dependen de ellos.
- **Archivos**: `docs/reference/rda-codes.md` (nuevo).
- **Detalles**: revisar `StructureDefinition-EncounterAmbulatoryRDA`, `-EncounterEmergencyRDA`, `-EncounterHospitalizationRDA`, la extensión de tipo de diagnóstico, `CodeSystem-ClaseTriage` y los ejemplos de `Encounter` y `Bundle` de la guía. Registrar sistema, códigos y display, con el enlace a la página fuente. Si un código no se puede confirmar, anotarlo como "por confirmar".
- **Depende de**: ninguna.
- **Verificación**: el documento lista, con URL de origen, los códigos de `use`, tipo de diagnóstico, clase/tipo de `Encounter` y triage.
- [x] Hecha (2026-09-19; `docs/reference/rda-codes.md`. Hallazgos: `use` usa el CodeSystem propio `ColombianDiagnosisRole` con códigos SNOMED; el triage va en `sectionTriage` LOINC 54094-8; las referencias de los ejemplos oficiales son relativas sin tipo)

### Tarea 3 — Datos sintéticos: un paciente con cuatro atenciones
- **Qué**: cuatro Bundles RDA sintéticos de un mismo paciente ficticio y un archivo inválido para pruebas de error.
- **Por qué**: CA-1, CA-2, CA-3, CA-4, CA-5 a CA-10, CA-15, CA-16; filas "Bundle sin diagnósticos", "código sin mapeo", "Bundles de pacientes distintos" y "datos sintéticos" de la sección 6.
- **Archivos**: `src/data/examples/paciente-01/consulta-2025-11-03.json`, `urgencias-2026-03-14.json`, `hospitalizacion-2026-03-15.json`, `consulta-2026-08-20.json`; `src/data/examples/paciente-02/consulta-2026-05-02.json` (otro paciente, para CA-3); `src/data/examples/invalido.json`; `src/data/examples/index.ts` (lista de ejemplos).
- **Detalles**:
  - Cada Bundle: `type: document`, primera entrada `Composition` con el perfil correspondiente y la sección `sectionProblems` (LOINC 11450-4) referenciando los `Condition`; `Patient` con nombre y documento evidentemente ficticios (p. ej. "Paciente Prueba Uno", documento `999999001`); `Encounter` con `class`, `type`, `period`, `serviceProvider`, `participant` y `diagnosis` con `use` y `rank`; `Condition` con `code` CIE-10 y `clinicalStatus`; `Practitioner`; `Organization`.
  - Casos que deben quedar cubiertos: la urgencias trae `ObservationTriageRDA` (Triage II) y un diagnóstico de complicación (CA-5, CA-10); la hospitalización trae una comorbilidad y un diagnóstico con `clinicalStatus: resolved` (CA-8); la última consulta trae un `Condition` solo en la sección, sin entrada en `Encounter.diagnosis` (CA-6), y un código sin mapeo, p. ej. `Z00.0` (CA-9); la primera consulta trae un solo diagnóstico para el flujo "información incompleta" (CA-4).
  - Usar los códigos verificados en la Tarea 2. Fechas dentro del último año (restricción de la guía para `period`).
- **Depende de**: Tarea 1, Tarea 2.
- **Verificación**: prueba en `src/data/examples/examples.test.ts` que carga cada ejemplo y comprueba: `resourceType: Bundle`, `type: document`, primera entrada `Composition`, mismo `Patient.identifier` en los cuatro Bundles del paciente 1, y que cada `Condition` referenciado desde `Encounter.diagnosis` existe en el Bundle.
- [x] Hecha (2026-09-19; los JSON se generan con `scripts/generate-examples.mjs` para mantenerlos consistentes; `src/data/examples/README.md` documenta qué caso cubre cada archivo y las diferencias conocidas con los perfiles)

### Tarea 4 — Modelo de dominio y lectura del Bundle
- **Qué**: tipos del dominio y función `parseBundle` que convierte un Bundle RDA en un `EncounterRecord` listo para las reglas, más `validateBundle` para rechazar archivos inválidos.
- **Por qué**: CA-1, CA-2, CA-3; filas "Bundle sin diagnósticos", "`Condition` no referenciado desde `Encounter.diagnosis`" y "Bundle mal formado" de la sección 6.
- **Archivos**: `src/domain/types.ts`, `src/fhir/parseBundle.ts`, `src/fhir/validateBundle.ts`, `src/fhir/references.ts` (resolver `reference` dentro del Bundle), pruebas `src/fhir/*.test.ts`.
- **Detalles**:
  - `types.ts`: `PatientSummary { id, identifier, name, birthDate, age, sex }`, `EncounterSummary { id, kind: 'ambulatory' | 'emergency' | 'hospitalization', start, end, providerName, practitionerName, triage?: { code, display } }`, `DiagnosisEntry { conditionId, code, display, clinicalStatus, isActive, use?: string, rank?: number, practitionerName?, organizationName?, encounterDate }`, `EncounterRecord { patient, encounter, diagnoses }`.
  - `validateBundle`: `resourceType === 'Bundle'`, `type === 'document'`, primera entrada `Composition`, hay `Patient` y `Encounter`; devuelve un error legible en español si falla.
  - `parseBundle`: resolver referencias por `fullUrl` o `ResourceType/id`; tomar los `Condition` desde `Encounter.diagnosis` (con `use` y `rank`) y también los que solo estén en `sectionProblems` (sin `use`); marcar `isActive` según `clinicalStatus` (`inactive`, `resolved`, `remission` → no activo); detectar `kind` por `Encounter.class` (`AMB`, `EMER`, `IMP`); extraer triage desde la `Observation` con código SNOMED `225390008`; calcular la edad a la fecha de la atención.
- **Depende de**: Tarea 1, Tarea 3.
- **Verificación**: pruebas unitarias con los cuatro Bundles de ejemplo (número de diagnósticos, `use` correcto, triage detectado, `Condition` solo en sección con `use` indefinido, `resolved` marcado como no activo) y con `invalido.json` (error legible).
- [x] Hecha (2026-09-19; `BundleIndex` en `src/fhir/references.ts` resuelve `fullUrl`, `Tipo/id`, URL absoluta e `id` a secas; `ageAt` en `src/domain/age.ts`)

### Tarea 5 — Configuración de reglas: CIE-10 → sistema y rol → nivel
- **Qué**: los archivos de configuración de las reglas clínicas, marcados como pendientes de validación clínica, y las funciones para consultarlos.
- **Por qué**: CA-6, CA-7, CA-9, CA-20; decisión de `CLAUDE.md` de mantener mapeos y rangos en configuración.
- **Archivos**: `src/rules/config/bodySystems.ts` (los 12 sistemas: id, nombre, si es región o chip), `src/rules/config/icd10ToSystem.ts`, `src/rules/config/diagnosisRoleLevel.ts`, `src/rules/levels.ts` (enum `Level` y orden), `src/rules/mapIcd10.ts`, pruebas.
- **Detalles**:
  - `icd10ToSystem.ts`: lista de rangos `{ from: 'I00', to: 'I99', system: 'cardiovascular' }` por capítulos y bloques de CIE-10, con `minLevel` opcional por rango o código (p. ej. `I21` → Grave). Encabezado del archivo: "PENDIENTE DE VALIDACIÓN CLÍNICA". Cubrir al menos: I → cardiovascular; J → respiratorio; G, algunos I6x → nervioso; K (salvo K70-K77) → digestivo; K70-K77, B15-B19 → hepático; N → renal/urinario y reproductor según bloque; E → endocrino/metabólico; D50-D89 → hematológico/inmune; M → musculoesquelético; L → tegumentario; F → salud mental. Dejar el resto sin mapeo.
  - `diagnosisRoleLevel.ts`: tabla `use` → nivel según los códigos de la Tarea 2 (complicación/muerte → Grave; admisión/egreso/principal → Moderado; comorbilidad → Leve; sin rol o desconocido → Leve con `reason: 'rol no registrado'`).
  - `mapIcd10(code)`: normaliza (`I10`, `I10.0`, `I100`) y devuelve `{ system, minLevel? } | undefined`.
- **Depende de**: Tarea 1, Tarea 2.
- **Verificación**: pruebas unitarias de `mapIcd10` (código dentro de rango, subcódigo con punto, código sin mapeo, `minLevel`) y de la tabla de roles (cada rol conocido, rol desconocido, sin rol).
- [x] Hecha (2026-09-19; los rangos específicos van antes que los capítulos y se aplica el primero que coincide)

### Tarea 6 — Motor de reglas: nivel por sistema con evidencia
- **Qué**: función pura `computeBodyState(record: EncounterRecord): BodyState` que devuelve, por cada uno de los 12 sistemas, el nivel, la lista de evidencias y la causa principal, más la lista de diagnósticos sin sistema.
- **Por qué**: CA-4 a CA-9; filas "Sin datos vs Normal" y "código sin mapeo" de la sección 6.
- **Archivos**: `src/rules/computeBodyState.ts`, `src/rules/types.ts` (`SystemState { systemId, level, evidence: Evidence[], cause?: Evidence }`, `Evidence { diagnosis, contributedLevel, reason }`), pruebas.
- **Detalles**: para cada diagnóstico activo, `mapIcd10` → sistema; nivel aportado = máximo entre el nivel por rol y `minLevel` de la tabla; el sistema toma el máximo ("gana el peor") y `cause` es la evidencia que lo produjo (en empate, la de menor `rank`). Los diagnósticos no activos se incluyen en `evidence` con `contributedLevel: null` y `reason: 'no activo'`. Sistemas sin evidencia → `Level.NoData` (nunca `Normal` en v1). Diagnósticos sin mapeo → `unmapped[]`.
- **Depende de**: Tarea 4, Tarea 5.
- **Verificación**: pruebas unitarias que cubren CA-4 (sistema sin evidencia → Sin datos), CA-5 (comorbilidad + complicación → Grave con causa correcta), CA-6 (sin rol → Leve, "rol no registrado"), CA-7 (`minLevel` sobrescribe), CA-8 (resolved no cuenta pero aparece), CA-9 (sin mapeo → `unmapped`).
- [x] Hecha (2026-09-19; un sistema cuyo único diagnóstico está resuelto queda en "Sin datos" con la evidencia listada como "no activo")

### Tarea 7 — Estado de la aplicación y carga de Bundles
- **Qué**: hook/estado que recibe archivos o ejemplos, valida, parsea, exige que todos sean del mismo paciente, ordena las atenciones por fecha descendente, y mantiene la atención y el sistema seleccionados.
- **Por qué**: CA-1, CA-2, CA-3, CA-15, CA-16; filas "Bundles de pacientes distintos" y "Bundle mal formado".
- **Archivos**: `src/state/usePatientHistory.ts`, `src/state/loadBundles.ts` (leer `File[]` o URLs de ejemplo → `EncounterRecord[]`), pruebas.
- **Detalles**: estado `{ status: 'idle' | 'loading' | 'ready' | 'error', error?, patient?, encounters: EncounterRecord[], selectedEncounterId?, selectedSystemId? }`. Al cargar: si algún Bundle falla la validación, estado `error` y no se muestra nada parcial; si los `Patient.identifier` difieren, error "Los archivos pertenecen a pacientes distintos". `bodyState` se deriva con `useMemo` de la atención seleccionada. Por defecto se selecciona la atención más reciente por `period.start`.
- **Depende de**: Tarea 4, Tarea 6.
- **Verificación**: pruebas del reducer/hook: carga válida selecciona la más reciente; archivo inválido → error sin datos parciales; pacientes distintos → error; cambiar atención recalcula `bodyState`.
- [x] Hecha (2026-09-19; reducer puro en `historyReducer.ts`, hook `usePatientHistory` deriva `record` y `bodyState` con `useMemo`; lectura de archivos con `FileReader` para que funcione también en jsdom)

### Tarea 8 — Pantalla de carga y encabezado del paciente
- **Qué**: pantalla inicial con selector de archivos (múltiple) y lista de pacientes de ejemplo; encabezado con nombre, edad, sexo e identificación; indicador "Viendo: tipo · fecha · prestador"; alerta de triage; etiqueta "Reglas pendientes de validación clínica"; mensajes de carga y de error.
- **Por qué**: CA-1, CA-2, CA-3, CA-10, CA-20; filas "Bundle sin diagnósticos", "triage en atención no urgente".
- **Archivos**: `src/components/BundleLoader.tsx`, `src/components/PatientHeader.tsx`, `src/components/TriageAlert.tsx`, `src/components/ViewingIndicator.tsx`, `src/App.tsx`, estilos.
- **Detalles**: `TriageAlert` muestra "Triage II · Emergencia" con color + texto y nota si la atención no es de urgencias. Aviso "Esta atención no registra diagnósticos" cuando la lista está vacía. Texto de interfaz en español.
- **Depende de**: Tarea 7.
- **Verificación**: pruebas con Testing Library: cargar ejemplo muestra encabezado y "Viendo"; archivo inválido muestra error; urgencias muestra triage y consulta no.
- [x] Hecha (2026-09-19; las fechas sin hora se formatean en UTC para que no retrocedan un día en UTC-5)

### Tarea 9 — Silueta SVG con regiones, chips, leyenda y tooltip
- **Qué**: componente `BodyMap` con la silueta frontal en SVG, nueve regiones anatómicas y tres chips, coloreadas por nivel con color + patrón + texto, leyenda de los cinco estados, tooltip en hover y foco, y navegación por teclado.
- **Por qué**: CA-1, CA-4, CA-11, CA-12, CA-17, CA-18; fila "Sin datos interpretado como Normal" y "color no distinguible".
- **Archivos**: `src/components/BodyMap/BodyMap.tsx`, `BodySilhouette.tsx` (paths SVG), `SystemRegion.tsx`, `SystemChip.tsx`, `Legend.tsx`, `SystemTooltip.tsx`, `src/components/BodyMap/levelStyles.ts` (paleta), pruebas.
- **Detalles**:
  - Paths SVG propios y simples (cabeza/cerebro, tórax con corazón y pulmones, abdomen con hígado, estómago/intestino, riñones, vejiga/pelvis, cuello/tiroides, extremidades y columna). Cada región es un `<g role="button" tabIndex=0 aria-label="Cardiovascular: Moderado">` con `<title>`.
  - Paleta de cinco estados con contraste ≥ 4.5:1 y distinguible en protanopia/deuteranopia (verde-azulado, amarillo, naranja, rojo oscuro/morado, gris con patrón de rayas para Sin datos). Cada región lleva un rótulo de texto corto o ícono con `aria-label`.
  - Tooltip accesible (aparece en hover y en foco; `aria-describedby`). Enter o Espacio equivalen a clic.
  - Región seleccionada con borde resaltado.
- **Depende de**: Tarea 6 (tipos de `BodyState`); puede desarrollarse en paralelo con la 7 y la 8 usando datos de prueba.
- **Verificación**: pruebas: renderiza 12 elementos con rol `button`; `aria-label` incluye el nivel; "Sin datos" no usa la clase de Normal; `onSelect` se dispara con clic y con Enter. Revisión visual con simulador de daltonismo (DevTools → Rendering → Emulate vision deficiencies).
- [x] Hecha (2026-09-19; paleta Okabe-Ito + rojo oscuro para Grave, "Sin datos" con trama de rayas; el tooltip vive siempre en el DOM y los botones lo referencian con `aria-describedby`. La revisión con simulador de daltonismo queda para la Tarea 12)

### Tarea 10 — Panel lateral de trazabilidad
- **Qué**: componente `SystemDetailPanel` que muestra el sistema seleccionado, su nivel, los diagnósticos que lo explican (código, descripción, rol, nivel aportado, estado clínico, fecha de la atención, profesional, organización) con la causa destacada, el mensaje de "Sin datos", y la sección "Diagnósticos sin sistema asignado".
- **Por qué**: CA-5, CA-6, CA-8, CA-9, CA-12, CA-13, CA-14; filas "diagnóstico sin fecha propia", "diagnóstico que desaparece entre atenciones".
- **Archivos**: `src/components/SystemDetailPanel.tsx`, `src/components/DiagnosisItem.tsx`, `src/components/UnmappedDiagnoses.tsx`, pruebas.
- **Detalles**: botón cerrar y tecla Escape cierran; cambiar de sistema con el panel abierto lo actualiza; texto "registrado en la atención del …" junto a la fecha; nota "Se muestra solo lo registrado en esta atención". Diagnósticos no activos en gris con "no activo". Sin datos: "No hay diagnósticos asociados a este sistema en esta atención".
- **Depende de**: Tarea 6, Tarea 9.
- **Verificación**: pruebas: la causa está destacada; "rol no registrado" aparece para diagnósticos sin `use`; resolved aparece como "no activo"; Escape cierra; la lista de sin mapeo muestra `Z00.0`.
- [x] Hecha (2026-09-19; "Diagnósticos sin sistema asignado" se muestra siempre bajo la silueta, no solo dentro del panel; al abrir o cambiar de sistema el foco va al título del panel)

### Tarea 11 — Selector de atención e integración final
- **Qué**: componente `EncounterSelector` (lista por fecha descendente con tipo, fecha y prestador) y el ensamblaje de todo en `App.tsx` con el layout de escritorio/tablet (silueta al centro, panel a la derecha, encabezado arriba).
- **Por qué**: CA-15, CA-16, CA-19, y el flujo "Ver el estado en una atención anterior".
- **Archivos**: `src/components/EncounterSelector.tsx`, `src/App.tsx`, `src/App.css`, pruebas.
- **Detalles**: al cambiar la atención se recalcula `bodyState`, se actualizan silueta, tooltip, panel (si está abierto, mismo sistema) y alerta de triage. Con una sola atención el selector queda deshabilitado con esa atención visible. Layout con CSS grid; a ≥ 768 px silueta y panel caben sin scroll horizontal; en anchos menores el panel pasa debajo.
- **Depende de**: Tareas 7, 8, 9, 10.
- **Verificación**: prueba de integración: cargar el paciente de ejemplo, elegir la urgencias, comprobar que cambia el nivel del sistema cardiovascular, el "Viendo" y el triage; con un solo Bundle el selector no ofrece opciones. Revisión manual a 768 px y 1280 px.
- [x] Hecha (2026-09-19; `src/App.integration.test.tsx` cubre CA-9, CA-13 a CA-16; revisado en el navegador a 1280 px (panel a la derecha) y 768 px (panel debajo, sin scroll horizontal))

### Tarea 12 — Pulido de accesibilidad y verificación en navegador
- **Qué**: revisión final de contraste, foco visible, orden de tabulación, textos en español, y ejecución del skill `verify-after-changes`.
- **Por qué**: CA-17, CA-18, CA-19, CA-20 y cierre del plan.
- **Archivos**: los que la revisión indique; `docs/plans/2026-09-19-silueta-cuerpo.md` (sección Verificación).
- **Detalles**: comprobar con DevTools (Lighthouse accesibilidad, emulación de deficiencias visuales); recorrer con teclado toda la pantalla; confirmar que ningún texto de interfaz quedó en inglés.
- **Depende de**: Tarea 11.
- **Verificación**: `npm run lint`, `npm test` y `npm run build` en verde; `verify-after-changes` con sus cinco casos aprobados.
- [ ] Hecha

### Cobertura
- CA-1: T3, T7, T8, T9 · CA-2: T4, T7, T8 · CA-3: T3, T7, T8 · CA-4: T6, T9 · CA-5: T3, T6, T10 · CA-6: T3, T5, T6, T10 · CA-7: T5, T6 · CA-8: T3, T6, T10 · CA-9: T3, T6, T10 · CA-10: T3, T4, T8 · CA-11: T9 · CA-12: T9, T10 · CA-13: T10 · CA-14: T10 · CA-15: T7, T11 · CA-16: T7, T11 · CA-17: T9, T12 · CA-18: T9, T12 · CA-19: T11, T12 · CA-20: T8.
- Sección 6 del spec: cada fila queda cubierta por T3, T4, T5, T6, T8, T9 o T10 según se indica en el "Por qué" de cada tarea.

## Riesgos y preguntas abiertas
- **Códigos de `Encounter.diagnosis.use`**: si la guía usa un CodeSystem propio distinto de `diagnosis-role`, la tabla rol → nivel de la Tarea 5 debe ajustarse; por eso la Tarea 2 va antes.
- **Fidelidad de los datos sintéticos**: sin validador FHIR, los Bundles pueden desviarse de los perfiles. Mitigación: seguir los ejemplos oficiales de la guía; la validación formal queda como trabajo futuro.
- **Reglas sin validación clínica**: mapeo CIE-10 y tabla de roles son propuestas. Etiqueta visible en la interfaz y archivos de configuración fáciles de cambiar.
- **Silueta en SVG propio**: dibujar paths razonables toma tiempo; se aceptan formas esquemáticas en v1 mientras las regiones sean reconocibles.
- **Diagnósticos crónicos que no se repiten en cada atención**: el médico puede verlos "desaparecer". Se advierte en la interfaz; integrar el RDA de paciente es trabajo futuro.
