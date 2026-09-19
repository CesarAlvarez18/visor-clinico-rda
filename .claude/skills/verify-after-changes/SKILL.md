---
name: verify-after-changes
description: Verifica en el navegador que la implementación de un plan cumple el plan y el spec. Levanta el servidor, elige los 5 casos de prueba más importantes, los prueba directamente en el navegador, recoge feedback, lo compara con el plan y el spec, y corrige lo que falle o da luz verde para terminar. Úsalo cuando se considere terminada la implementación de un plan de docs/plans/ (todas o casi todas las tareas marcadas como hechas) o cuando el usuario pida "verifica", "prueba los cambios", "revisemos que funcione". NO usar a mitad de una tarea ni para cambios sin plan.
---

# Verify after changes (verificación en el navegador)

Objetivo: comprobar con evidencia, en la aplicación real, que lo implementado cumple el objetivo del plan y los criterios del spec; corregir lo que falte o dar luz verde.

## Dónde están los documentos

- **El plan se encuentra en `docs/plans/YYYY-MM-DD-title.md`**: objetivo, contexto, spec de referencia y tareas con su verificación.
- **El spec se encuentra en `docs/specs/YYYY-MM-DD-title.md`** (mismo `title` que el plan, enlazado en la sección "Spec de referencia"): criterios de aceptación (CA-x), comportamiento esperado y posibles errores y mitigaciones.

Si hay varios planes, usa el de la conversación actual o pregunta cuál. Si alguna tarea del plan no está marcada `- [x] Hecha`, avisa y pregunta si se verifica igual o se termina primero.

## Paso 1 — Preparar

1. Lee el plan y el spec completos, y `CLAUDE.md` (comandos de build/test/run).
2. Corre las pruebas automatizadas del proyecto si existen. Si fallan, arréglalas antes de seguir o repórtalas.

## Paso 2 — Levantar el servidor

- Usa el navegador integrado (herramientas `mcp__Claude_Browser__*`). Arranca el servidor con `preview_start` usando la configuración de `.claude/launch.json`; si no existe, créala con el comando de desarrollo del proyecto (el de `CLAUDE.md`) y su puerto.
- Revisa `preview_logs` para confirmar que arrancó sin errores. Si no arranca, ese es el primer fallo a corregir.
- Usa solo **datos sintéticos** (Bundles RDA de ejemplo), nunca datos reales de pacientes.

## Paso 3 — Elegir 5 casos de prueba

Elige los **5 casos más importantes**, priorizando:
1. El flujo principal del spec (el que da el valor central al médico).
2. Criterios de aceptación de mayor riesgo o impacto clínico.
3. Al menos un caso de error o dato faltante de la sección "Posibles errores y mitigaciones" (p. ej. "Sin datos" no se ve como "Normal", código sin mapeo, RDA incompleto).
4. Interacción clave de la interfaz (silueta: hover / clic en un sistema; selector de fecha o atención; tarjetas de tendencias).
5. Accesibilidad o legibilidad (color + texto, escritorio y tablet con `resize_window`).

Antes de probar, lista los 5 casos en una tabla: **#, caso, CA / tarea que cubre, pasos, resultado esperado**.

## Paso 4 — Probar en el navegador

Para cada caso:
- Ejecuta los pasos en el navegador (`navigate`, `find`, `computer` para clics y hover, `form_input`).
- Verifica el resultado con `read_page` / `get_page_text` y toma `screenshot` como evidencia visual.
- Revisa `read_console_messages` (errores JS) y, si aplica, `read_network_requests`.
- Registra: **Pasa / Falla / Parcial**, lo observado y la evidencia.

No marques un caso como "Pasa" sin haberlo visto funcionar.

## Paso 5 — Recoger feedback y comparar con plan y spec

1. Presenta al usuario la tabla de resultados de los 5 casos con la evidencia.
2. **Pide feedback al usuario** (también puede probar directamente en el panel del navegador): qué le pareció, qué falta, qué no se ve bien.
3. Compara resultados + feedback contra:
   - el **Objetivo** del plan (¿quedó funcionando lo prometido?);
   - los **criterios de aceptación** y la sección de **errores y mitigaciones** del spec;
   - lo **fuera de alcance** (no corregir cosas que el spec excluyó; anótalas como mejoras futuras).
4. Clasifica cada hallazgo: **bloqueante** (incumple objetivo o CA), **menor** (no bloquea), **fuera de alcance**.

## Paso 6 — Decidir: corregir o luz verde

Pregunta con `AskUserQuestion`:
- **Corregir**: arregla los hallazgos bloqueantes (y los menores que el usuario elija), vuelve a probar los casos afectados en el navegador y regresa al Paso 5. Repite hasta que no queden bloqueantes.
- **Luz verde**: solo si no hay hallazgos bloqueantes, o el usuario acepta explícitamente dejarlos pendientes.

Al dar luz verde:
- Cambia el estado del plan a `Estado: completado` y agrega al final del plan una sección `## Verificación` con fecha, los 5 casos, su resultado y los pendientes / mejoras futuras.
- Si surgieron decisiones de arquitectura, stack o dominio, ofrece registrarlas en `CLAUDE.md`.
- Detén el servidor con `preview_stop` si ya no se necesita.
