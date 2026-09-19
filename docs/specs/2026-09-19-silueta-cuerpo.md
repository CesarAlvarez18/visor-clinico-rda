# Silueta del cuerpo interactiva

- Fecha: 2026-09-19
- Estado: aprobado (revisado el 2026-09-19 tras verificar la guía RDA: signos vitales fuera de v1, nivel por rol del diagnóstico)
- Approach elegido: **A — Todo en el navegador.** Aplicación web que lee Bundles RDA sintéticos, calcula el nivel de afectación de cada sistema corporal con reglas configurables y dibuja una silueta en SVG con panel de trazabilidad.

## 1. Overview

La silueta del cuerpo es la vista principal del visor clínico. Muestra al médico, de un vistazo, qué sistemas corporales del paciente están afectados y con qué gravedad en una atención, ya sea la más reciente o una anterior. Cada sistema se colorea según un semáforo de cuatro niveles (Normal, Leve, Moderado, Grave) o se marca como "Sin datos". Al pasar el cursor se ve un resumen; al hacer clic se abre un panel que explica el nivel con los diagnósticos que lo produjeron, con fecha y prestador. El valor para el médico es responder en segundos "¿qué tiene este paciente y qué lo sustenta?" sin leer toda la historia.

## 2. Usuarios objetivo

- **Médico general o especialista en consulta externa**: antes de entrar el paciente, quiere un panorama de sus problemas activos y de cómo llegó a la última atención.
- **Médico de urgencias**: necesita ver rápidamente los sistemas comprometidos y la clasificación de triage de la última atención, para priorizar.
- **Médico de hospitalización**: quiere revisar el estado del paciente en atenciones previas para entender la evolución.

En todos los casos la decisión clínica es del médico; la silueta orienta la lectura de la historia, no diagnostica.

## 3. Contexto del problema

Hoy la historia clínica se lee como texto secuencial por atención. Para saber qué sistemas están afectados, el médico debe recorrer diagnósticos y notas de varias atenciones y armar mentalmente el cuadro. Eso toma tiempo, se pierde información entre prestadores y es fácil pasar por alto un diagnóstico de una atención anterior.

Con la Resolución 1888 de 2025, cada atención produce un **RDA**: un `Bundle` de tipo documento en HL7 FHIR R4 con una `Composition` y secciones fijas. La historia de un paciente es, por tanto, un **conjunto de Bundles, uno por atención**. Lo que la guía de implementación (v1.0.0, https://vulcano.ihcecol.gov.co/) aporta a la silueta:

| Recurso / perfil RDA | Qué aporta a la silueta |
|---|---|
| `Patient` (`PatientRDA`) | Encabezado: nombre, edad, sexo, identificación |
| `Encounter` (`EncounterAmbulatoryRDA`, `EncounterEmergencyRDA`, `EncounterHospitalizationRDA`) | Selector de atenciones: tipo, `period`, prestador. `Encounter.diagnosis` enlaza cada diagnóstico con su rol (`use`: admisión, egreso, comorbilidad, complicación, muerte) y `rank` |
| `Condition` (`ConditionRDA`) | Diagnóstico CIE-10 (`http://hl7.org/fhir/sid/icd-10`) y `clinicalStatus`; → sistema corporal |
| `Observation` de triage (`ObservationTriageRDA`, solo urgencias) | Clasificación Triage I–V como alerta global de la atención |
| `Composition` | Fecha del documento y autor; sección `sectionProblems` con los diagnósticos |
| `Practitioner`, `Organization` | Origen de cada dato en el panel de trazabilidad |

Hallazgos de la guía que condicionan el diseño:
- **No existe un perfil de signos vitales** en el RDA v1.0.0. Por eso los signos vitales quedan fuera de v1.
- **`ConditionRDA` no permite `severity`, `onset`, `abatement`, `recordedDate` ni `bodySite`.** La gravedad de un diagnóstico se infiere del rol que tiene en la atención (`Encounter.diagnosis.use`) y de la tabla de mapeo; la vigencia se infiere de la atención en cuyo Bundle aparece.

Restricciones:
- **Solo lectura**: el visor no modifica datos clínicos.
- **Solo datos sintéticos** en desarrollo y pruebas; nunca datos reales de pacientes.
- La guía RDA es la fuente de verdad para perfiles y códigos. Los códigos exactos de `Encounter.diagnosis.use` deben tomarse de la guía.
- **Accesibilidad**: cada nivel se transmite con color **y** texto o ícono; apto para daltonismo.

## 4. Alcance v1

### Incluido
- Carga de uno o varios Bundles RDA sintéticos (archivos JSON locales o ejemplos incluidos) de un mismo paciente; cada Bundle es una atención.
- Encabezado con nombre, edad y sexo del paciente.
- Silueta frontal del cuerpo en SVG con regiones clicables para los sistemas con órgano visible: **cardiovascular** (corazón), **respiratorio** (pulmones), **nervioso** (cerebro), **digestivo** (estómago e intestinos), **hepático** (hígado), **renal / urinario** (riñones y vejiga), **endocrino / metabólico** (tiroides y páncreas), **musculoesquelético** (extremidades y columna), **reproductor** (pelvis).
- Chips alrededor de la silueta, con el mismo comportamiento que las regiones, para los sistemas sin órgano localizable: **tegumentario (piel)**, **hematológico / inmune**, **salud mental**.
- Semáforo de cuatro niveles + "Sin datos", siempre con color y texto.
- Nivel por sistema calculado a partir de los diagnósticos de la atención: cada diagnóstico aporta un nivel según su rol en la atención (`Encounter.diagnosis.use`) o según la tabla de mapeo si esta lo sobrescribe; el sistema toma el peor ("gana el peor").
- Alerta global de triage (I–V) cuando la atención es de urgencias y trae `ObservationTriageRDA`.
- Hover: tooltip con nombre del sistema, nivel y motivo principal.
- Clic: panel lateral de trazabilidad con los diagnósticos que explican el nivel, con rol, fecha y prestador de cada uno.
- Selector de atención (`Encounter`): por defecto la más reciente; al elegir otra, la silueta, la alerta de triage y el panel muestran el estado en esa atención.
- Lista "Diagnósticos sin sistema asignado" para códigos CIE-10 que no están en el mapeo.
- Leyenda visible con los cinco estados.
- Mapeo CIE-10 → sistema (con nivel opcional por código) y tabla rol → nivel en archivos de configuración, marcados como pendientes de validación clínica.

### Fuera de alcance
- Signos vitales, laboratorios y cualquier `Observation` distinta del triage. Se retoman cuando la guía RDA o una fuente complementaria los aporte.
- Medicamentos, alergias, procedimientos, vacunación y antecedentes (tarjetas futuras).
- Gráficos de tendencia.
- Comparación lado a lado de dos atenciones o flechas de mejora/empeoramiento.
- Arrastre de diagnósticos entre atenciones (un diagnóstico de una atención anterior no colorea la actual si el Bundle actual no lo trae).
- Vista posterior del cuerpo.
- Autenticación, auditoría y conexión con el mecanismo nacional de IHCE o un servidor FHIR.
- Validación formal de los Bundles contra los perfiles de la guía (validador FHIR).

### Supuestos
- **Estado en una atención** = los `Condition` referenciados desde `Encounter.diagnosis` (o incluidos en `sectionProblems`) del Bundle de esa atención, con `clinicalStatus` distinto de `inactive`, `resolved` o `remission`.
- **Nivel por rol del diagnóstico** (pendiente de validación clínica): complicación o muerte → Grave; diagnóstico principal de admisión o egreso → Moderado; comorbilidad u otro rol → Leve. La tabla CIE-10 puede fijar un nivel mínimo por código (p. ej. un infarto siempre Grave). Un diagnóstico sin `use` aporta Leve y se marca "rol no registrado".
- Un código CIE-10 mapea a **un solo sistema** en v1.
- Los diagnósticos sin mapeo no afectan ningún sistema, pero se listan aparte para que no se pierdan.
- El triage no modifica el nivel de ningún sistema; es una alerta global de la atención.
- Si se cargan varios Bundles de pacientes distintos, se muestra un error y no se mezclan.

## 5. Comportamiento esperado

### Flujo: Ver el estado del paciente en su última atención
1. El médico abre el visor y carga uno o varios Bundles RDA sintéticos (o elige un paciente de ejemplo).
2. El sistema muestra el encabezado del paciente, la silueta con los doce sistemas coloreados según su nivel en la atención más reciente, la leyenda, el selector de atención con esa atención seleccionada y, si es de urgencias, la alerta de triage.
3. Cada región y chip muestra, además del color, el texto del nivel (o un ícono con texto alternativo).

### Flujo: Entender por qué un sistema está afectado
1. El médico pasa el cursor sobre el corazón.
2. El sistema muestra un tooltip: "Cardiovascular · Moderado · I10 Hipertensión esencial (diagnóstico principal)".
3. El médico hace clic en el corazón.
4. El sistema abre el panel lateral con: nombre del sistema, nivel, y la lista de diagnósticos asignados al sistema (código CIE-10, descripción, rol en la atención, nivel que aporta, `clinicalStatus`, fecha de la atención, profesional y organización). El diagnóstico que determinó el nivel final está destacado.
5. El médico cierra el panel o hace clic en otro sistema, y el panel cambia.

### Flujo: Ver el estado en una atención anterior
1. El médico abre el selector de atención y ve la lista de atenciones ordenada por fecha descendente, con tipo (consulta externa, urgencias, hospitalización), fecha y prestador.
2. El médico elige una atención anterior.
3. El sistema recalcula y vuelve a colorear la silueta con los diagnósticos de esa atención; el panel, si estaba abierto, se actualiza al mismo sistema; la alerta de triage aparece o desaparece según el tipo de atención.
4. Un indicador visible recuerda qué atención se está viendo (por ejemplo, "Viendo: Urgencias · 2026-03-14 · Hospital San Ejemplo").

### Flujo: Atención con información incompleta
1. El médico carga un Bundle de consulta externa que trae un solo diagnóstico.
2. El sistema colorea el sistema de ese diagnóstico y marca como "Sin datos" los otros once.
3. En el panel de un sistema "Sin datos" se lee: "No hay diagnósticos asociados a este sistema en esta atención".

### Criterios de aceptación

**Carga y estados básicos**
- **CA-1** **Dado** uno o varios Bundles RDA sintéticos válidos, **cuando** el médico los carga, **entonces** en menos de 2 segundos se ven encabezado, silueta con los 12 sistemas, leyenda y selector de atención.
- **CA-2** **Dado** un archivo que no es un Bundle FHIR de tipo documento con `Composition`, **cuando** el médico lo carga, **entonces** se muestra un mensaje de error claro y la silueta no se dibuja con datos parciales.
- **CA-3** **Dado** Bundles de pacientes distintos, **cuando** el médico los carga juntos, **entonces** se muestra un error y no se mezclan.
- **CA-4** **Dado** un sistema sin diagnósticos asociados, **cuando** se dibuja la silueta, **entonces** ese sistema aparece con el estilo "Sin datos" (patrón distinto, gris con texto "Sin datos") y nunca con el color de "Normal".

**Cálculo del nivel**
- **CA-5** **Dado** un sistema con un diagnóstico de comorbilidad (Leve) y otro de complicación (Grave), **cuando** se calcula el nivel, **entonces** el sistema queda en Grave y el panel destaca el diagnóstico de complicación como causa.
- **CA-6** **Dado** un diagnóstico sin `Encounter.diagnosis.use`, **cuando** se calcula el nivel, **entonces** aporta Leve y el panel indica "rol no registrado".
- **CA-7** **Dado** un código CIE-10 con nivel mínimo fijado en la tabla de mapeo, **cuando** su rol sugiere un nivel menor, **entonces** se usa el nivel de la tabla.
- **CA-8** **Dado** un `Condition` con `clinicalStatus` `resolved`, `inactive` o `remission`, **cuando** se calcula el nivel, **entonces** no cuenta, pero aparece en el panel como "no activo".
- **CA-9** **Dado** un código CIE-10 sin mapeo, **cuando** se procesa el Bundle, **entonces** aparece en "Diagnósticos sin sistema asignado" y no afecta ningún sistema.
- **CA-10** **Dado** una atención de urgencias con `ObservationTriageRDA`, **cuando** se selecciona, **entonces** se muestra la alerta "Triage N" con su descripción; en atenciones sin triage la alerta no aparece.

**Interacción**
- **CA-11** **Dado** la silueta dibujada, **cuando** el médico pasa el cursor sobre una región o chip, **entonces** aparece el tooltip con sistema, nivel y motivo principal (o "Sin datos").
- **CA-12** **Dado** la silueta dibujada, **cuando** el médico hace clic en una región o chip, **entonces** se abre el panel lateral de ese sistema y la región queda resaltada como seleccionada.
- **CA-13** **Dado** el panel abierto para un sistema, **cuando** el médico hace clic en otro sistema, **entonces** el panel muestra el nuevo sistema sin cerrarse.
- **CA-14** **Dado** el panel abierto, **cuando** el médico presiona Escape o el botón de cerrar, **entonces** el panel se cierra y la selección desaparece.
- **CA-15** **Dado** varias atenciones cargadas, **cuando** el médico elige una anterior en el selector, **entonces** la silueta, el tooltip, el panel y la alerta de triage reflejan esa atención y el indicador "Viendo: …" cambia.
- **CA-16** **Dado** una sola atención cargada, **cuando** se muestra, **entonces** el selector la muestra seleccionada y no ofrece más opciones.

**Accesibilidad**
- **CA-17** **Dado** cualquier nivel, **cuando** se dibuja, **entonces** el color va acompañado de texto o ícono con texto alternativo, y los cinco estados son distinguibles en simulación de daltonismo (protanopia, deuteranopia).
- **CA-18** **Dado** la silueta, **cuando** el médico navega con teclado (Tab), **entonces** puede recorrer las regiones y chips, ver el tooltip y abrir el panel con Enter.
- **CA-19** **Dado** una pantalla de tablet (≥ 768 px de ancho), **cuando** se abre el visor, **entonces** silueta y panel son usables sin desplazamiento horizontal.
- **CA-20** **Dado** el prototipo, **cuando** se muestra la silueta, **entonces** hay una etiqueta visible "Reglas pendientes de validación clínica".

## 6. Posibles errores y mitigaciones

| Error / situación | Impacto para el médico | Mitigación |
|---|---|---|
| Bundle sin diagnósticos (`sectionProblems` vacía) | Toda la silueta queda sin información | Mostrar "Sin datos" en los 12 sistemas y un aviso "Esta atención no registra diagnósticos" |
| Código CIE-10 no reconocido o sin mapeo a sistema | Un diagnóstico relevante no colorea la silueta | Listarlo en "Diagnósticos sin sistema asignado" y registrar el código para ampliar el mapeo |
| `Condition` no referenciado desde `Encounter.diagnosis` (solo en la sección) | No se conoce su rol | Tomarlo igual desde `sectionProblems`, aportar Leve y marcar "rol no registrado" |
| Código de `use` distinto a los esperados | Nivel incorrecto | Tabla rol → nivel configurable; rol desconocido se trata como "rol no registrado" |
| Diagnóstico sin fecha propia (la guía no la permite) | No se sabe desde cuándo existe | Mostrar la fecha de la atención como referencia y decirlo explícitamente: "registrado en la atención del …" |
| Un diagnóstico aparece en una atención y no en la siguiente | El médico puede creer que se resolvió | No arrastrar diagnósticos (fuera de alcance) y dejar claro en la interfaz que se ve "solo lo registrado en esta atención" |
| Triage presente en una atención que no es de urgencias | Contradicción con la guía | Mostrarlo igual con una nota "triage en atención no urgente" |
| "Sin datos" interpretado como "Normal" | Falsa tranquilidad | Estilo claramente distinto (gris con patrón y texto), leyenda siempre visible, nunca verde. En v1 ningún sistema puede quedar "Normal" solo por ausencia de diagnósticos |
| Color no distinguible (daltonismo, pantalla de baja calidad) | Lectura errónea del nivel | Texto o ícono junto al color; paleta probada con simuladores; contraste ≥ 4.5:1 |
| Bundle grande o mal formado que tarda en procesarse | Espera o pantalla en blanco | Indicador de carga; validación básica del Bundle con mensaje de error claro; no dibujar con datos parciales |
| Bundles de pacientes distintos cargados juntos | Historia mezclada | Comparar identificador de `Patient`; rechazar la carga con un mensaje |
| Reglas sin validación clínica en producción | Decisiones basadas en reglas no avaladas | Etiqueta "Reglas pendientes de validación clínica" visible; archivos de configuración versionados |
| Uso accidental de datos reales en desarrollo | Violación de privacidad (Ley 1581 de 2012) | Solo Bundles sintéticos en el repositorio; nombres y documentos ficticios evidentes; sin envío de datos a servicios externos |

---
Preguntas abiertas:
- ¿Quién valida clínicamente el mapeo CIE-10 → sistema y la tabla rol → nivel?
- ¿Cuáles son los códigos exactos de `Encounter.diagnosis.use` en la guía (¿`http://terminology.hl7.org/CodeSystem/diagnosis-role` o un CodeSystem propio?) y de `ExtensionDiagnosisType`? Se verifica en la tarea de datos sintéticos.
- ¿Los Bundles sintéticos los generamos nosotros siguiendo la guía o se reutilizan los ejemplos oficiales (Bundle de ejemplo por tipo de RDA)?
- ¿Cómo integrar más adelante el "RDA de paciente" (`ConditionStatementRDA`, antecedentes) para no perder diagnósticos crónicos entre atenciones?
- ¿Un diagnóstico debe poder mapear a más de un sistema (p. ej. diabetes → endocrino y renal)? En v1 se asume un solo sistema por código.
- ¿Cómo se representa la afectación en musculoesquelético cuando el diagnóstico es de una extremidad concreta? En v1 se colorea todo el sistema.
