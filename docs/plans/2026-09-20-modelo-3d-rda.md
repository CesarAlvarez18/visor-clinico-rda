# Plan: Modelo anatómico 3D conectado al RDA

- Fecha: 2026-09-20
- Estado: completado (ver Verificación al final)
- Spec: [docs/specs/2026-09-20-modelo-3d-rda.md](../specs/2026-09-20-modelo-3d-rda.md)

## 1. Objetivo

Al terminar, el médico podrá alternar en el visor entre la silueta 2D y un **modelo anatómico 3D real** (GLB generado desde BodyParts3D), con piel azul translúcida, esqueleto color hueso y fondo azul profundo. Cada sistema corporal del modelo se colorea con el mismo nivel de afectación de la atención seleccionada que ya calcula el visor, con hover, clic al panel de trazabilidad, rótulos en texto y respaldo automático a 2D.

## 2. Contexto del problema

La silueta SVG es plana y la vista `/?vista=3d` actual es una demostración con primitivas, separada del visor y sin datos del paciente (ver spec, sección 3).

Estado del código:
- `src/App.tsx` arma el visor con `usePatientHistory()` → `state`, `record`, `bodyState`. `BodyMap` recibe `{ bodyState, selectedSystemId, onSelect }`: **ese mismo contrato de props** lo usará la vista 3D, así 2D y 3D leen el mismo estado (CA-6).
- `src/rules/` no cambia: `BodyState.systems[BodySystemId]` trae `level`, `evidence` y `cause`. `BODY_SYSTEMS` distingue `display: 'region' | 'chip'`.
- `src/components/BodyMap/levelStyles.ts` tiene la paleta (`LEVEL_STYLES`, `TREE_NO_DATA`, `BONE_COLOR`); `SystemChip`, `SystemTooltip` y `Legend` son reutilizables.
- `src/components/Anatomy3D/`: `AnatomyScene` (Canvas, Bloom, OrbitControls, `normalizeModel`), `fresnelMaterial` (piel), `figureMaterials` (material "gel"), `classifyMesh` (4 capas por nombre), `proceduralAnatomy` (primitivas con la misma jerarquía que el GLB), `figures.ts` + `AnatomyFigure` (fila de figuras, a retirar). `src/Root.tsx` carga la vista con `lazy`.
- Stack ya instalado: three 0.186, R3F 9.7, Drei 10.7, postprocessing. React fijado en `~19.2`.

Decisiones técnicas de este plan:
- **Contrato de nombres del GLB**: un nodo raíz por grupo — `skin`, `skeleton`, y `system:<BodySystemId>` para cada sistema con estructura (`system:cardiovascular`, `system:nervous`, …). Los huesos largos van en `system:musculoskeletal`; el resto del esqueleto en `skeleton`. La anatomía procedural adopta el mismo contrato, así la conexión al RDA se construye y prueba antes de tener el modelo real.
- **Pipeline en Node** (`scripts/build-anatomy-glb.mjs`) con `@gltf-transform/core|functions|extensions` + `meshoptimizer` como devDependencies: lee OBJ, une las mallas de cada grupo, simplifica, cuantiza y comprime con **Meshopt** (no Draco: Drei lo decodifica sin pedir el decodificador a un CDN externo, coherente con no depender de servicios externos).
- **Origen de las mallas**: BodyParts3D (CC BY-SA 2.1 JP), descargado con permiso explícito del usuario a `vendor/bodyparts3d/` (**ignorado por git**). Solo se versiona el `public/models/anatomy.glb` resultante (< 10 MB) con su atribución.
- La tabla **parte anatómica (FMA) → grupo** es configuración del script, marcada pendiente de validación clínica.
- Solo datos sintéticos; el modelo no contiene datos clínicos. Sin reglas clínicas nuevas.

## 3. Spec de referencia

- [docs/specs/2026-09-20-modelo-3d-rda.md](../specs/2026-09-20-modelo-3d-rda.md) (aprobado).
- Criterios cubiertos: CA-1 a CA-22 (cobertura por tarea al final).
- Fuera de alcance (del spec): reglas clínicas nuevas, laboratorios, signos vitales, tendencias; afectación por órgano o por lado; músculos detallados, capas conmutables, cortes; modelos por sexo, edad o contextura; animaciones fisiológicas; comparación lado a lado; retirar la silueta 2D.

## 4. Tareas

### Tarea 1 — Contrato sistema ↔ malla
- **Qué**: reemplazar la clasificación de 4 capas por una que devuelva `{ kind: 'skin' } | { kind: 'skeleton' } | { kind: 'system', systemId: BodySystemId }`.
- **Por qué**: base de CA-6, CA-8, CA-9, CA-10, CA-13 y de la mitigación "malla sin sistema asignado".
- **Archivos**: `src/components/Anatomy3D/classifyMesh.ts` y `classifyMesh.test.ts` (modificar).
- **Detalles**: primero el contrato exacto (`system:<id>` en la malla o en un ancestro, validado contra `BODY_SYSTEM_IDS`); como respaldo para GLB de terceros, patrones por nombre en inglés/español (heart/aorta/arter/vein → cardiovascular; lung/trachea/bronch → respiratory; brain/nerve/spinal cord → nervous; stomach/intestin/colon/esophag → digestive; liver/gallbladder → hepatic; kidney/ureter/bladder → renal; thyroid/pancreas/adrenal → endocrine; femur/tibia/fibula/humerus/radius/ulna → musculoskeletal; uterus/ovary/prostate/testis → reproductive). Sin coincidencia → `skin` solo si el nombre lo indica; si no, `skeleton`/sin sistema no clicable. Exportar `MODEL_SYSTEM_IDS` (los 9 sistemas `display: 'region'`). Quitar `visceralTint`.
- **Depende de**: ninguna.
- **Verificación**: pruebas unitarias de cada sistema, de la precedencia del ancestro más cercano y de nombres desconocidos.
- [x] Hecha

### Tarea 2 — Anatomía procedural con el nuevo contrato
- **Qué**: reagrupar `buildProceduralAnatomy()` en `skin`, `skeleton` y `system:<id>`, y añadir lo que falte para los 9 sistemas (tiroides, páncreas, riñones, vejiga, hígado, región pélvica, médula y nervios periféricos, huesos largos separados del esqueleto axial).
- **Por qué**: permite construir y probar toda la conexión al RDA sin el modelo real, y sirve de respaldo de desarrollo.
- **Archivos**: `src/components/Anatomy3D/proceduralAnatomy.ts` (modificar), `proceduralAnatomy.test.ts` (crear).
- **Detalles**: mantener medidas (1.77 m, pies en y = 0). Brazos separados del tronco, palmas al frente.
- **Depende de**: Tarea 1.
- **Verificación**: prueba de que cada id de `MODEL_SYSTEM_IDS` tiene al menos una malla clasificada en su sistema.
- [x] Hecha

### Tarea 3 — Paleta y materiales 3D por nivel
- **Qué**: materiales de la figura única: piel Fresnel azul, esqueleto color hueso, y un material "gel" por sistema cuyo color e intensidad dependen del nivel.
- **Por qué**: CA-7, CA-8, CA-9, CA-10 y mitigaciones "Sin datos leído como Normal" y "brillo altera los colores".
- **Archivos**: `src/components/Anatomy3D/levelMaterials.ts` + `levelMaterials.test.ts` (crear); `figureMaterials.ts` (eliminar al final de la Tarea 5).
- **Detalles**: función pura `systemAppearance(systemId, level)` → `{ color, emissiveIntensity, opacity }` usando `LEVEL_STYLES[level].badgeFill`; en `no-data`: vasos `TREE_NO_DATA.vessels`, nervios `TREE_NO_DATA.nerves`, huesos largos `BONE_COLOR`, órganos azul neutro apagado, con emisión baja (por debajo del umbral de Bloom). Esqueleto: `BONE_COLOR`, sin transmisión. `createModelMaterials()` crea un material por sistema y expone `update(bodyState, highlightedId, selectedId)` que muta color/emisión (sin recrear materiales) y `dispose()`. Resaltado = más emisión; seleccionado = emisión alta sostenida.
- **Depende de**: Tarea 1.
- **Verificación**: pruebas de `systemAppearance`: `no-data` nunca devuelve un color de `LEVEL_STYLES`; vasos/nervios sin datos ≠ rojo/amarillo; cada nivel devuelve el color de la escala.
- [x] Hecha

### Tarea 4 — Escena de una figura conectada a `bodyState`
- **Qué**: componente `AnatomyModel` que clona la fuente (GLB o procedural), asigna materiales por clasificación y los actualiza cuando cambian `bodyState`, el sistema resaltado o el seleccionado; nueva `AnatomyScene` con una figura central, fondo azul profundo y encuadre de cuerpo completo.
- **Por qué**: CA-6, CA-16, CA-17, CA-21; flujo "Ver una atención anterior en 3D".
- **Archivos**: `src/components/Anatomy3D/AnatomyModel.tsx` (crear), `AnatomyScene.tsx` (modificar).
- **Detalles**: props de la escena `{ source: 'model' | 'procedural', bodyState, highlightedId, selectedId, onHover, onSelect, resetSignal }`. Fondo: `<color>` azul profundo + viñeta radial (plano detrás o gradiente CSS con canvas `alpha`). Cámara frontal que encuadra 1.77 m según el aspecto (adaptar `FitCamera`). `OrbitControls` sin pan, con límites de distancia y ángulo polar; "Vista frontal" = `controls.reset()` al cambiar `resetSignal`. El cambio de atención solo llama `materials.update`, sin remontar el Canvas (conserva cámara). Pulso del contorno y cualquier vaivén se desactivan con `prefers-reduced-motion`. `dpr` máx. 1.5 y `multisampling` 0 en pantallas táctiles. Bloom con umbral que solo alcance los sistemas con nivel.
- **Depende de**: Tareas 2 y 3.
- **Verificación**: `npm run build` y `npm run lint` limpios; comprobación visual en la Tarea 6.
- [x] Hecha

### Tarea 5 — Interacción: hover, clic y rótulos
- **Qué**: eventos de puntero de R3F sobre las mallas de sistemas, tooltip, y rótulos de nivel anclados a cada sistema.
- **Por qué**: CA-11, CA-13, CA-14, CA-15, CA-18; mitigaciones "clic accidental al rotar" y "órganos tapados".
- **Archivos**: `AnatomyModel.tsx` (modificar), `src/components/Anatomy3D/SystemLabels.tsx` (crear), `src/components/Anatomy3D/anchors.ts` (crear).
- **Detalles**: `onPointerOver/Out` → `onHover(systemId, clientX, clientY)` con `stopPropagation` para tomar solo la malla más cercana; la piel y el esqueleto no clasificado no capturan eventos (`raycast` anulado) para poder apuntar a los órganos a través de la piel. Clic: `onClick` solo si `event.delta` ≤ 4 px. Toque en tablet = clic. `anchors.ts`: centro del `Box3` de las mallas de cada sistema (para vasos/nervios/huesos largos, un punto fijo representativo: corazón, cerebro, fémur). Rótulos con `<Html>` de Drei: badge con `LEVEL_STYLES[level].short` + nombre, desplazado al margen con línea guía, solo para sistemas con nivel ≠ `no-data`; `pointer-events: none`; sin `occlude` para que sigan legibles al rotar.
- **Depende de**: Tarea 4.
- **Verificación**: prueba unitaria del cálculo de anclas con la anatomía procedural; interacción comprobada en navegador en la Tarea 6.
- [x] Hecha

### Tarea 6 — Vista 3D dentro del visor y conmutador 2D / 3D
- **Qué**: componente `BodyModel3D` con las mismas props que `BodyMap`, conmutador en `App`, carga diferida, indicador de carga y respaldo a 2D.
- **Por qué**: CA-1 a CA-5, CA-12, CA-22; flujos "Cambiar a la vista 3D", "Volver a 2D" y "El equipo no puede mostrar 3D".
- **Archivos**: `src/components/Anatomy3D/BodyModel3D.tsx` + `.css` (crear), `src/components/ViewModeToggle.tsx` (crear), `src/components/Anatomy3D/webglSupport.ts` (crear), `src/App.tsx`, `src/App.css`, `src/Root.tsx` (modificar); eliminar `Anatomy3DView.tsx/.css`, `AnatomyFigure.tsx`, `figures.ts`, `figureMaterials.ts` y el enlace "Anatomía 3D (demostración)".
- **Detalles**: `viewMode: '2d' | '3d'` como estado local de `App` (por defecto `'2d'`, se conserva al cambiar de atención; no se persiste entre sesiones). `ViewModeToggle`: grupo de dos botones con `aria-pressed`. `BodyModel3D` se importa con `lazy` desde `App` (three.js sigue fuera del bundle principal; `Root.tsx` queda solo con `App`). Dentro: `Suspense` con "Cargando modelo anatómico…", `useModelStatus` (HEAD al GLB, ya existe) → `model` o `procedural` con aviso de marcador de posición; error boundary + `webglSupport()` → llama `onUnavailable()` y `App` vuelve a 2D mostrando "No se pudo mostrar el modelo 3D. Se mantiene la silueta 2D.". Reutilizar `SystemChip` (3 sistemas chip), `SystemTooltip` y `Legend` de `BodyMap/`. Botón "Vista frontal". Pie con "Modelo anatómico genérico · BodyParts3D (CC BY-SA 2.1 JP)". `RulesNotice` ya está en `App` y aplica a ambas vistas. `useGLTF.preload` no se usa, para cumplir CA-3.
- **Depende de**: Tarea 5.
- **Verificación**: pruebas con Testing Library de `App` (con `BodyModel3D` simulado): conmutador por defecto en 2D, alterna y conserva `selectedSystemId`; respaldo a 2D cuando la vista 3D reporta fallo. En navegador: alternar vistas con un ejemplo y comprobar en la red que el chunk de three y el GLB solo se piden al pulsar 3D.
- [x] Hecha

### Tarea 7 — Lista de sistemas accesible
- **Qué**: lista de los 9 sistemas del modelo (nombre + nivel en texto) junto al lienzo, operable con teclado, que resalta el sistema en el modelo al recibir foco y abre el panel con Enter o clic.
- **Por qué**: CA-19, CA-20; mitigación "órganos tapados" (la lista siempre está completa).
- **Archivos**: `src/components/Anatomy3D/SystemList.tsx` + prueba (crear), `BodyModel3D.tsx` (modificar).
- **Detalles**: botones con `aria-pressed` para el seleccionado y texto "Hepático · Moderado" / "Renal / urinario · Sin datos". El lienzo lleva `aria-hidden` y la lista es la alternativa textual. Foco → `highlightedId`. En tablet se muestra como fila compacta bajo el lienzo.
- **Depende de**: Tarea 6.
- **Verificación**: pruebas de render (9 sistemas con su nivel), foco → `onHighlight`, Enter → `onSelect`.
- [x] Hecha

### Tarea 8 — Descargar BodyParts3D y elegir las partes
- **Qué**: obtener las mallas OBJ de BodyParts3D y definir la tabla parte → grupo del modelo.
- **Por qué**: insumo del modelo real; mitigaciones de licencia y de "malla mal asignada".
- **Archivos**: `vendor/bodyparts3d/` (ignorado por git), `.gitignore` (modificar), `scripts/anatomy-parts.mjs` (crear), `docs/reference/bodyparts3d.md` (crear).
- **Detalles**: **pedir permiso explícito al usuario antes de descargar**, indicando origen (archivo oficial de DBCLS o su clon en GitHub), archivos y tamaño. Usar el árbol *is-a* / *part-of* y la lista de partes (FMA id ↔ nombre ↔ archivo OBJ) que trae el conjunto de datos. `anatomy-parts.mjs` exporta, por grupo (`skin`, `skeleton`, `system:<id>`), la lista de conceptos FMA a incluir: piel; esqueleto completo menos huesos largos; huesos largos (húmero, radio, cúbito, fémur, tibia, peroné); corazón, aorta y arterias/venas principales de tronco y extremidades; pulmones, tráquea y bronquios principales; encéfalo, médula espinal y nervios periféricos principales; esófago, estómago, intestino delgado y colon; hígado y vesícula; riñones, uréteres y vejiga; tiroides, páncreas y suprarrenales; órganos pélvicos reproductores. Documentar en `docs/reference/bodyparts3d.md` origen, versión, licencia, fecha de descarga y la tabla, marcada **pendiente de validación clínica**.
- **Depende de**: ninguna (puede hacerse en paralelo a las Tareas 1-7).
- **Verificación**: script de comprobación que confirma que cada concepto de la tabla resuelve a archivos OBJ existentes y que ningún OBJ queda en dos grupos.
- [x] Hecha

### Tarea 9 — Pipeline OBJ → `anatomy.glb`
- **Qué**: script reproducible que arma el GLB con el contrato de nombres, optimizado a menos de 10 MB.
- **Por qué**: "modelo anatómico real"; CA-2 (peso y tiempo de carga); supuesto de < 10 MB.
- **Archivos**: `scripts/build-anatomy-glb.mjs` (crear), `package.json` (script `build:model` y devDependencies `@gltf-transform/core`, `@gltf-transform/functions`, `@gltf-transform/extensions`, `meshoptimizer`), `public/models/anatomy.glb` (generado), `public/models/README.md` (actualizar), `public/models/LICENSE.md` (crear).
- **Detalles**: lector OBJ mínimo (vértices y caras; BodyParts3D no usa materiales). Por grupo: unir mallas, `weld`, `simplify` (meshoptimizer) con razón distinta por grupo (piel y esqueleto más agresivo; vasos y nervios menos, para no romper tubos finos), recalcular normales, `quantize`, compresión Meshopt. Convertir ejes y unidades (BodyParts3D viene en mm y con Z hacia arriba) para que quede Y arriba, de frente a +Z; `normalizeModel` sigue ajustando estatura y pies. Un nodo por grupo con el nombre exacto del contrato. Informe al final: triángulos y KB por grupo, total, y error si supera 10 MB o si falta un grupo de `MODEL_SYSTEM_IDS`. `LICENSE.md`: atribución "BodyParts3D, © The Database Center for Life Science, CC BY-SA 2.1 Japan", cambios hechos (selección, simplificación, agrupación) y que el GLB se comparte bajo la misma licencia.
- **Depende de**: Tareas 1 y 8.
- **Verificación**: `npm run build:model` genera el GLB; prueba Vitest (se omite si el archivo no existe) que lee el JSON del GLB y comprueba que cada sistema de `MODEL_SYSTEM_IDS`, `skin` y `skeleton` tienen nodo; tamaño < 10 MB.
- [x] Hecha

### Tarea 10 — Integrar el modelo real y ajustar el render
- **Qué**: cargar el GLB real en la escena y afinar materiales, luces, Bloom, anclas y rendimiento para acercarse a la imagen de referencia.
- **Por qué**: Overview del spec (estética), CA-2, CA-11, CA-18; mitigación "brillo altera los colores".
- **Archivos**: `AnatomyScene.tsx`, `AnatomyModel.tsx`, `levelMaterials.ts`, `fresnelMaterial.ts`, `anchors.ts` (ajustes).
- **Detalles**: `useGLTF(MODEL_URL)` con Meshopt (sin Draco). Piel: azul translúcido con borde luminoso, `depthWrite: false`, dibujada al final. Esqueleto color hueso semitranslúcido para no tapar los órganos del tórax. Revisar orden de dibujo de transparencias (órganos dentro de costillas). Comparar en pantalla los cuatro niveles + sin datos sobre el fondo azul y ajustar emisión hasta que sean distinguibles y el texto siga siendo la referencia. Medir FPS en ventana de tablet (768 px); bajar `dpr` o quitar Bloom en táctil si hace falta.
- **Depende de**: Tareas 6 y 9.
- **Verificación**: en navegador con los tres pacientes de ejemplo: capturas de frente y rotado; tiempos de primera carga y de segunda apertura (CA-2).
- [x] Hecha

### Tarea 11 — Prueba de equivalencia 2D / 3D y limpieza
- **Qué**: prueba automática de que 2D y 3D muestran el mismo nivel por sistema, y retiro del código de la demostración.
- **Por qué**: CA-6; mitigación "diferencias entre 2D y 3D".
- **Archivos**: `src/components/Anatomy3D/equivalence.test.tsx` (crear); revisar imports muertos; `vite.config.ts` si quedó configuración solo de la demo.
- **Detalles**: para cada Bundle de `src/data/examples/`, calcular `bodyState` y comprobar que `SystemList` + chips de la vista 3D muestran el mismo texto de nivel que regiones + chips de `BodyMap`.
- **Depende de**: Tarea 7.
- **Verificación**: `npm test`, `npm run lint` y `npm run build` limpios.
- [x] Hecha

### Tarea 12 — Documentación
- **Qué**: actualizar `CLAUDE.md` y las referencias.
- **Por qué**: convención del proyecto (registrar decisiones).
- **Archivos**: `CLAUDE.md`, `public/models/README.md`.
- **Detalles**: reemplazar la decisión "Vista Anatomía 3D (demostración)" por la vista 3D conectada (conmutador, contrato `system:<id>`, BodyParts3D + `npm run build:model`, Meshopt, licencia CC BY-SA); cerrar la decisión pendiente del modelo GLB; añadir el comando; anotar las preguntas abiertas del spec (modelo femenino, validación de la tabla parte → sistema, compatibilidad de la licencia).
- **Depende de**: Tarea 10.
- **Verificación**: lectura cruzada con el spec.
- [x] Hecha

Después de la Tarea 12: skill `verify-after-changes`.

### Cobertura
- CA-1, 3, 4, 5 → T6 · CA-2 → T6, T9, T10 · CA-6 → T4, T11 · CA-7, 8, 9, 10 → T3 · CA-11 → T5, T10 · CA-12 → T6 · CA-13, 14, 15 → T5 · CA-16, 17 → T4 · CA-18 → T4, T5, T10 · CA-19, 20 → T7 · CA-21 → T4 · CA-22 → T6.
- Mitigaciones de la sección 6: carga/fallo y equipo sin 3D → T6; "Sin datos", vasos/nervios y brillo → T3, T10; modelo genérico y modelo masculino (rótulo solo con el nombre del sistema, nota visible) → T5, T6; órganos tapados → T5, T7; clic accidental → T5; malla sin sistema → T1, T8, T9; diferencias 2D/3D → T11; licencia → T8, T9, T12; privacidad → solo Bundles sintéticos en todas las tareas.

## Riesgos y preguntas abiertas
- **Peso y calidad del modelo**: BodyParts3D es muy denso; llegar a < 10 MB puede degradar vasos y nervios finos. Plan B: menos ramas periféricas o subir el límite con aprobación del usuario.
- **Piel de BodyParts3D**: puede tener poca calidad o la pose con brazos poco separados; se acepta la pose (supuesto del spec). Si la piel no sirve, plan B: envolvente simplificada generada a partir de las partes.
- **Transparencias en three.js**: el orden de dibujo de órganos translúcidos dentro de la piel puede producir artefactos; se resuelve con `renderOrder` y `depthWrite`, pero requiere ajuste visual (T10).
- **Rendimiento en tablet**: transmisión + Bloom son costosos; T4 y T10 prevén una calidad reducida.
- **Descarga**: requiere permiso explícito del usuario (T8). Sin él, el feature queda funcional con la anatomía procedural y el aviso de marcador de posición.
- Preguntas abiertas del spec (no bloqueantes): validación clínica de la tabla parte → sistema, modelo femenino, recordar la preferencia 2D/3D, capa muscular. La compatibilidad de la licencia quedó resuelta (ver Verificación): BodyParts3D usa CC BY 4.0, no CC BY-SA.

## Verificación

Hecho el 2026-09-20, con los tres pacientes de ejemplo (`Paciente Prueba Uno`, `Paciente Prueba Dos`, `Mateo Quintero Restrepo`).

- **Automatizada**: `npm test` (115/115), `npm run lint` y `npm run build` limpios; `node scripts/verify-anatomy-parts.mjs` confirma que los 64 conceptos de la tabla resuelven a los 960 archivos `.obj` reales y que ninguno se repite entre grupos.
- **Manual en navegador**: conmutador 2D → 3D y de vuelta conserva paciente, atención, sistema seleccionado y panel abierto (CA-4). Con el modelo real: piel azul translúcida con borde Fresnel, esqueleto color hueso semitranslúcido, pulmones y riñones en rojo ("Grave") visibles a través de las costillas, árbol vascular en naranja ("Moderado"). Clic directo sobre el pulmón en el lienzo abre el panel de trazabilidad correcto (Respiratorio, J13 + J80, "Grave" por complicación). Clic sobre un ítem de la lista accesible (`SystemList`) abre el mismo panel. "Vista frontal" encuadra el cuerpo completo; rotar con arrastre funciona.
- **Corrección durante la verificación** (no parte del diseño original, encontrada al integrar el modelo real):
  - **Licencia**: la fuente oficial de BodyParts3D (actualizada 2025-02-25) usa **CC BY 4.0**, no CC BY-SA 2.1 Japón como decían el spec y este plan. Corregido en `docs/reference/bodyparts3d.md`, `public/models/LICENSE.md`, el pie de `BodyModel3D.tsx` y `CLAUDE.md`.
  - **Árbol de datos**: se cambió de IS-A a **PART-OF** (ver Tarea 8) porque el IS-A no trae una malla por órgano completo.
  - **Resolución de partes**: cada concepto FMA de `anatomy-parts.mjs` es la unión de varias mallas finas (`FJ####.obj`, vía `partof_element_parts.txt`), no un único archivo por "id de representación" como se asumió al principio — ver `anatomy-elements.mjs`.
  - **Normales**: los OBJ de BodyParts3D sí traen una normal por vértice (mismo índice que la posición); el pipeline las incluye en el GLB. Sin ellas, el material Fresnel de la piel no se veía (normal nula en el shader).
  - **Encuadre inicial de cámara**: `OrbitControls` inicializaba después del primer ajuste de `CameraRig` y lo pisaba; se corrigió reaplicando el encuadre en el siguiente cuadro (`requestAnimationFrame`).
  - **Transparencias**: se agregó `depthWrite: false` a los materiales de órganos y esqueleto para que los órganos posteriores (riñones, pulmones detrás de costillas) no quedaran ocultos por el buffer de profundidad de lo que está delante.
- **Limitaciones aceptadas** (documentadas en `docs/reference/bodyparts3d.md`, no bloquean el feature): sin tiroides completa, sin nervios periféricos de extremidades, sin útero/ovario/testículo (modelo único adulto varón), sin esqueleto propio del pie.
- **Mejoras futuras** (fuera de esta verificación): afinar más la posición de los rótulos de nivel sobre el modelo real; medir FPS en tablet con el modelo real (T10 lo hizo con la anatomía procedural); considerar una capa muscular tenue.
