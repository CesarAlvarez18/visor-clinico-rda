---
name: design-spec
description: Redacta el archivo de especificación de un feature desde el punto de vista del usuario (el médico), en docs/specs/YYYY-MM-DD-title.md. Úsalo cuando el problema y lo que se quiere hacer ya están claros — típicamente después de feature-brainstorming, cuando el usuario ya eligió un approach — y el usuario pide "hagamos el spec", "escribe la especificación", "documenta el feature" o quiere pasar de la idea al plan. NO usar si el objetivo todavía es ambiguo (primero usar feature-brainstorming), ni para planes técnicos de implementación, ni para bugs o ajustes pequeños.
---

# Design spec (especificación desde el punto de vista del usuario)

Objetivo: dejar por escrito **qué** debe hacer el feature y **cómo lo vive el médico**, no cómo se implementa. El spec es la referencia para planear, construir y validar el feature.

## Antes de escribir

1. **Verifica que hay claridad.** Necesitas: objetivo, usuario y contexto, alcance y approach elegido. Tómalos de la conversación (por ejemplo, el resumen de `feature-brainstorming`) y de `CLAUDE.md`. Si falta algo esencial, haz como máximo 2 o 3 preguntas puntuales con `AskUserQuestion`; si el objetivo sigue siendo ambiguo, recomienda correr `feature-brainstorming` primero y detente.
2. **Lee `CLAUDE.md`** para respetar la visión, la fuente de datos (RDA / HL7 FHIR), la interfaz (silueta + tarjetas y cuadros), los principios de diseño y la normativa. No contradigas decisiones ya registradas.
3. **Revisa `docs/specs/`** por si ya existe un spec del mismo feature o de uno relacionado. Si existe, propone actualizarlo en lugar de crear uno nuevo, y enlaza los relacionados.

## Nombre y ubicación del archivo

- Ruta: `docs/specs/YYYY-MM-DD-title.md` (crear la carpeta si no existe).
- `YYYY-MM-DD`: fecha de hoy.
- `title`: nombre corto del feature en kebab-case, en minúsculas, sin tildes ni ñ (ej. `2026-09-19-silueta-sistemas-corporales.md`).

## Reglas de redacción

- Escribe en español, desde la perspectiva del médico: lo que ve, hace y obtiene. Evita detalles de implementación (frameworks, clases, endpoints); si un detalle técnico condiciona la experiencia (p. ej. qué recurso FHIR aporta un dato), menciónalo breve.
- Sé concreto y verificable: cada comportamiento debe poder comprobarse al probar el feature.
- No inventes reglas clínicas (rangos, umbrales, mapeos CIE-10). Si hacen falta, márcalas como **pendiente de validación clínica**.
- Marca los supuestos como supuestos y las dudas como preguntas abiertas.
- Usa solo ejemplos con datos sintéticos, nunca datos reales de pacientes.

## Plantilla

Usa exactamente estas seis secciones, en este orden:

```markdown
# <Título del feature>

- Fecha: YYYY-MM-DD
- Estado: borrador
- Approach elegido: <nombre y una frase, si viene de feature-brainstorming>

## 1. Overview
Qué es el feature y qué valor aporta al médico, en 3 a 5 líneas.

## 2. Usuarios objetivo
Quién lo usa (tipo de médico / especialidad), en qué contexto (consulta externa,
urgencias, hospitalización) y qué necesita resolver en ese momento.

## 3. Contexto del problema
Situación actual y por qué es un problema (tiempo, riesgo, información dispersa…).
Qué datos del RDA están disponibles para resolverlo y qué restricciones aplican
(solo lectura, privacidad, normativa).

## 4. Alcance v1
### Incluido
- …
### Fuera de alcance
- …
### Supuestos
- …

## 5. Comportamiento esperado
Flujos principales paso a paso desde el punto de vista del médico, y criterios
de aceptación en formato Dado / Cuando / Entonces:

### Flujo: <nombre>
1. El médico …
2. El sistema muestra …

### Criterios de aceptación
- **Dado** … **cuando** … **entonces** …

Incluye estados vacíos, carga y "Sin datos", interacción (hover, clic, selector
de fecha) y accesibilidad (color + texto).

## 6. Posibles errores y mitigaciones
| Error / situación | Impacto para el médico | Mitigación |
|---|---|---|
| … | … | … |

Considera al menos: datos faltantes o incompletos en el RDA, códigos no
reconocidos o sin mapeo, datos desactualizados o contradictorios entre atenciones,
fallas o lentitud al obtener los RDA, errores de interpretación visual
(p. ej. "sin datos" leído como "normal") y riesgos de privacidad.

---
Preguntas abiertas:
- …
```

## Al terminar: approval gate

1. Escribe el archivo y muestra la ruta al usuario con un resumen de 3 a 5 líneas (alcance, criterios clave, preguntas abiertas).
2. **Approval gate** — no avances sin una decisión explícita del usuario. Pregunta con `AskUserQuestion`:
   - **Iterar el spec**: el usuario indica qué cambiar (o qué sección revisar). Aplica los cambios en el mismo archivo, resume qué cambió y vuelve a este gate. Repite cuantas veces haga falta.
   - **Aprobar y continuar con `design-plan`**: cambia `Estado: borrador` por `Estado: aprobado` y pasa al skill `design-plan` con este spec.
   - **Aprobar y detenerse aquí**: marca `Estado: aprobado` sin generar el plan todavía.
   Si quedan preguntas abiertas que bloquean el comportamiento esperado, dilo en el gate y recomienda iterar antes de aprobar.
3. Si el spec tomó una decisión de arquitectura, stack o dominio, ofrece registrarla en `CLAUDE.md`.
