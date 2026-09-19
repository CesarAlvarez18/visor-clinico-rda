# CLAUDE.md

Memoria del proyecto para Claude Code. Mantener este archivo corto y actualizado: cuando se tome una decisión de arquitectura, stack o dominio, se registra aquí.

## Visión del producto

Visor clínico para que **médicos consulten la historia clínica de un paciente** y vean **la evolución de su estado de salud** de forma visual. La vista principal es una **silueta del cuerpo humano interactiva** donde cada sistema corporal se colorea según su nivel de afectación. Se complementa con **tarjetas y cuadros** de tendencias, signos vitales, laboratorios, medicamentos, diagnósticos, etc. El objetivo es que la atención en la clínica sea **más interactiva y eficiente**.

- **Usuario objetivo**: médicos que consultan la historia clínica del paciente (consulta, urgencias, hospitalización).
- **Fuente de datos**: el **Resumen Digital de Atención en Salud (RDA)** de la **Resolución 1888 de 2025** (MinSalud Colombia), en **HL7 FHIR R4**.

### Preguntas que la herramienta debe responder en segundos
1. ¿Qué sistemas del cuerpo están afectados hoy y con qué gravedad?
2. ¿Cómo ha cambiado cada sistema en el tiempo? (mejora, estable, empeora)
3. ¿Qué indicadores explican esa afectación y cuáles están fuera de rango?
4. ¿Qué pasó entre una atención y la siguiente? (diagnósticos, procedimientos, medicamentos)

## Fuente de datos: RDA (Res. 1888 de 2025) sobre HL7 FHIR

- La Res. 1888 de 2025 adopta el RDA como mecanismo obligatorio de Interoperabilidad de la Historia Clínica Electrónica (IHCE). Cada atención genera un documento RDA estandarizado.
- **Guía de implementación oficial**: https://vulcano.ihcecol.gov.co/ (canonical `https://fhir.minsalud.gov.co/rda/ImplementationGuide/minsalud.fhir.co.rda`, FHIR **R4**). **Es la fuente de verdad** para perfiles, CodeSystems y ValueSets: consultarla antes de modelar o mapear cualquier recurso; no inventar perfiles ni códigos.
- **Tipos de documento RDA**: RDA de paciente (resumen del paciente), RDA de consulta externa, RDA de urgencias, RDA de hospitalización. Cada uno es un `Bundle` de tipo documento con una `Composition`.
- **Recursos FHIR relevantes y uso en el visor**:

| Recurso FHIR | Uso en el visor |
|---|---|
| `Patient` | Encabezado: identificación, edad, sexo |
| `Encounter` (ambulatorio, urgencias, hospitalización) | Línea de tiempo de atenciones |
| `Condition` | Diagnósticos → asignación a sistemas corporales |
| `Observation` | Signos vitales, triage, resultados → indicadores y tendencias |
| `MedicationStatement` / `MedicationRequest` / `MedicationAdministration` | Tarjeta de farmacia / medicamentos |
| `AllergyIntolerance` | Alertas de alergias |
| `Procedure`, `ServiceRequest` | Procedimientos y órdenes |
| `Immunization` | Vacunación |
| `FamilyMemberHistory`, factores de riesgo | Antecedentes |
| `Practitioner`, `Organization` | Quién y dónde atendió |

- Pendiente verificar en la guía: cómo vienen los **laboratorios clínicos** (perfil de `Observation` y codificación, p. ej. LOINC/CUPS) y las **"Operaciones RDA"** disponibles para consultar documentos.
- Terminologías a esperar: CIE-10 para diagnósticos, CUPS para procedimientos, CUM para medicamentos, además de los CodeSystems propios de la guía.

## Conceptos del dominio

- **Sistema corporal**: agrupación anatómica y funcional; es una región clicable de la silueta.
- **Indicador**: medición concreta (signo vital, laboratorio, escala clínica) asociada a uno o más sistemas.
- **Rango de referencia**: límites normales de un indicador; pueden depender de edad, sexo, embarazo u otras condiciones.
- **Nivel de afectación**: estado resumido de un sistema en una fecha, calculado a partir de diagnósticos (`Condition`) e indicadores (`Observation`).
- **Evolución**: serie temporal de niveles de afectación e indicadores a lo largo de los `Encounter`.

### Sistemas corporales (lista inicial)
Cardiovascular · Respiratorio · Nervioso · Digestivo · Hepático · Renal / urinario · Endocrino / metabólico · Hematológico / inmune · Musculoesquelético · Tegumentario (piel) · Reproductor · Salud mental.

La asignación diagnóstico → sistema se hará por capítulos/rangos de **CIE-10** (tabla de mapeo configurable, validada con personal clínico).

### Indicadores de ejemplo por sistema
Solo de referencia; la lista definitiva y los rangos deben validarse con personal clínico.
- Cardiovascular: presión arterial, frecuencia cardíaca, perfil lipídico.
- Respiratorio: frecuencia respiratoria, saturación de oxígeno (SpO₂).
- Renal: creatinina, tasa de filtración glomerular (TFG).
- Endocrino / metabólico: glucosa, HbA1c, TSH, IMC.
- Hepático: ALT, AST, bilirrubina.
- Hematológico: hemoglobina, leucocitos, plaquetas.
- Nervioso: escala de Glasgow, escala de dolor.
- Salud mental: escalas de tamizaje (p. ej. PHQ-9, GAD-7).

### Escala de afectación (propuesta)
Semáforo de 4 niveles, siempre acompañado de texto o ícono (no depender solo del color):
`Normal` · `Leve` · `Moderado` · `Grave` · y `Sin datos` como estado explícito (nunca mostrar "sin datos" como "normal").

## Interfaz

- **Silueta del cuerpo humano (vista principal)**: regiones por sistema coloreadas según el nivel de afectación; hover muestra resumen, clic abre el detalle del sistema. Selector de fecha / atención para ver el estado en cada momento.
- **Tarjetas y cuadros alrededor de la silueta**:
  - Signos vitales (último valor + tendencia en miniatura).
  - Laboratorios clínicos (valor, rango, marca de fuera de rango, gráfico de tendencia).
  - Farmacia / medicamentos (activos e históricos, en línea de tiempo).
  - Diagnósticos activos y resueltos.
  - Alergias y alertas (siempre visibles).
  - Línea de tiempo de atenciones (consulta externa, urgencias, hospitalización).
  - Procedimientos, vacunación y antecedentes.
- **Detalle de sistema**: indicadores del sistema, gráficos de tendencia y diagnósticos que explican su nivel de afectación.

## Principios de diseño

- **Vista general primero, detalle a demanda**: silueta → sistema → indicadores → serie temporal.
- **El tiempo es un eje central**: toda vista permite comparar contra atenciones anteriores.
- **Trazabilidad**: todo nivel de afectación se explica mostrando los recursos FHIR y reglas que lo produjeron, con fecha y prestador de origen.
- **Rápido de leer en consulta**: pocos clics; pantallas de escritorio y tablet.
- **Accesible**: contraste adecuado, color + texto, apto para daltonismo.
- **La herramienta apoya, no diagnostica**: muestra datos y alertas; la decisión clínica es del médico.
- **Solo lectura** sobre la historia clínica: el visor consume RDA, no modifica datos clínicos.

## Datos de salud: privacidad y normativa

- Los datos del paciente son **datos sensibles**. Aplican, entre otras, la Ley 1581 de 2012 (protección de datos personales), la Resolución 1995 de 1999 (historia clínica) y la Resolución 1888 de 2025 (RDA / IHCE).
- En desarrollo y pruebas usar **solo datos sintéticos** (Bundles RDA de ejemplo conformes a la guía). Nunca subir datos reales de pacientes al repositorio, a logs ni a servicios externos.
- Acceso autenticado y registro de auditoría de quién consulta qué historia.

## Estado del proyecto

- **Fase**: implementación del primer feature, la silueta del cuerpo interactiva (spec `docs/specs/2026-09-19-silueta-cuerpo.md`, plan `docs/plans/2026-09-19-silueta-cuerpo.md`).
- **Stack (prototipo)**: **React 19 + TypeScript + Vite 8**, todo en el navegador (sin backend). Pruebas con **Vitest 5** + Testing Library (jsdom); lint con **oxlint** (el que trae la plantilla de Vite). Tipos FHIR con `@types/fhir`. Silueta en **SVG propio**. Backend, autenticación y auditoría se agregarán cuando se salga de datos sintéticos.
- **Capas en `src/`**: `domain/` (tipos del dominio), `fhir/` (lectura y validación de Bundles), `rules/` (mapeos, configuración y cálculo de nivel como funciones puras, para poder moverlas a un backend después), `state/` (estado de la aplicación), `components/` (silueta, panel, selector, encabezado), `data/examples/` (Bundles sintéticos), `test/` (setup de pruebas).
- **Comandos**: `npm run dev` (servidor en http://localhost:5173), `npm run build`, `npm test` (Vitest, una pasada), `npm run test:watch`, `npm run lint`. En Claude Code el servidor se levanta con la configuración `visor` de `.claude/launch.json`.
- **Datos sintéticos**: `node scripts/generate-examples.mjs` regenera los Bundles de `src/data/examples/` (editar el script, no los JSON). Códigos y perfiles verificados en `docs/reference/rda-codes.md`.

## Decisiones tomadas

- **Fuente de datos del prototipo**: Bundles RDA **sintéticos** en JSON, cargados localmente (sin servidor FHIR ni IHCE todavía).
- **Lo que dice la guía RDA v1.0.0 (verificado 2026-09-19)**: no hay perfil de signos vitales (las `Observation` son triage, resultado de procedimiento por CUPS, nota aclaratoria, ocupación e incapacidad). `ConditionRDA` prohíbe `severity`, `onset`, `abatement`, `recordedDate` y `bodySite`; solo trae `code` (CIE-10 `http://hl7.org/fhir/sid/icd-10`), `clinicalStatus` y `verificationStatus`. `Encounter.diagnosis` trae `use` (admisión, egreso, comorbilidad, complicación, muerte) y `rank`. Cada RDA es un Bundle **por atención**.
- **Nivel de afectación (v1)**: solo con diagnósticos del Bundle de la atención. Cada `Condition` activo aporta un nivel según su rol en `Encounter.diagnosis.use` (tabla configurable: complicación/muerte → Grave, principal → Moderado, comorbilidad → Leve), que la tabla CIE-10 puede subir por código. Regla **"gana el peor"**: el sistema toma el nivel más alto y guarda la evidencia que lo produjo. Los diagnósticos no se arrastran entre atenciones.
- **Signos vitales**: fuera de v1 porque el RDA no los trae. El triage de urgencias (`ObservationTriageRDA`) se muestra como alerta global, no por sistema.
- **Mapeo CIE-10 → sistema** y **tabla rol → nivel**: archivos de configuración, pendientes de validación clínica.

## Decisiones pendientes

- [ ] Quién valida clínicamente las reglas, el mapeo CIE-10 y los rangos.
- [ ] Mapeo de laboratorios y escalas → sistema corporal (después de v1).
- [ ] Obtención de RDA en producción: consulta al mecanismo nacional de IHCE o servidor FHIR propio.
- [ ] Backend y forma de despliegue.

## Skills del proyecto

- **`feature-brainstorming`** (`.claude/skills/feature-brainstorming/SKILL.md`): usarlo **siempre al iniciar un feature nuevo**, antes de planear o escribir código. Hace preguntas para eliminar la ambigüedad del objetivo, resume el objetivo aclarado y presenta 2 o 3 approaches para que el usuario elija con cuál se hace el plan. No usarlo para bugs ni ajustes pequeños.
- **`design-spec`** (`.claude/skills/design-spec/SKILL.md`): usarlo **cuando el problema y lo que se quiere hacer ya están claros** (normalmente después de `feature-brainstorming`). Redacta la especificación desde el punto de vista del médico en `docs/specs/YYYY-MM-DD-title.md` con las secciones: 1. Overview, 2. Usuarios objetivo, 3. Contexto del problema, 4. Alcance v1, 5. Comportamiento esperado, 6. Posibles errores y mitigaciones. Termina con un **approval gate**: iterar el spec o aprobarlo y continuar con `design-plan`.
- **`design-plan`** (`.claude/skills/design-plan/SKILL.md`): usarlo **después de que el usuario aprueba el spec**. Genera el plan de implementación en `docs/plans/YYYY-MM-DD-title.md` (mismo `title` que el spec) con: 1. Objetivo, 2. Contexto del problema, 3. Spec de referencia, 4. Lista de tareas con detalles (qué, por qué, archivos, dependencias, verificación). No escribe código.
- **`verify-after-changes`** (`.claude/skills/verify-after-changes/SKILL.md`): usarlo **cuando se considere terminada la implementación del plan**. Lee el plan (`docs/plans/YYYY-MM-DD-title.md`) y su spec, levanta el servidor, elige 5 casos de prueba importantes, los prueba en el navegador, recoge feedback y lo compara con plan y spec. Luego corrige lo que falle o da luz verde (plan → `Estado: completado` con sección de Verificación).

Flujo para un feature nuevo: `feature-brainstorming` → `design-spec` (approval gate) → `design-plan` → implementación tarea por tarea → `verify-after-changes` (corregir o luz verde).

## Convenciones de trabajo

- Idioma: documentación y textos de interfaz en **español**; código (nombres de variables, funciones) en inglés salvo que se decida lo contrario.
- Nombres de recursos y campos FHIR se usan tal cual (en inglés, como en la especificación).
- Actualizar este archivo cuando cambie una decisión de las secciones anteriores.
