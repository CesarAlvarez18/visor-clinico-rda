---
name: feature-brainstorming
description: Aclara el objetivo de un feature nuevo antes de planearlo o construirlo. Hace preguntas para eliminar la ambigüedad y al final presenta 2 o 3 approaches para que el usuario elija cómo armar el plan. Úsalo siempre que el usuario esté iniciando un feature nuevo en este proyecto ("quiero agregar…", "nuevo feature", "empecemos con…", "quiero construir…", "hagamos la vista de…"), incluso si no dice "brainstorming". NO usar para correcciones de bugs, ajustes pequeños a algo que ya existe, ni cuando el usuario ya eligió un approach y pide ejecutarlo.
---

# Brainstorming de features

Objetivo: que el usuario salga con un objetivo **sin ambigüedad** y elija entre **2 o 3 approaches** concretos. No se escribe código ni el plan final en este skill; eso viene después de que el usuario decide.

Antes de empezar, lee `CLAUDE.md` del proyecto (visión, fuente de datos RDA / HL7 FHIR, interfaz, principios, decisiones pendientes) y revisa el código existente relacionado con el feature. No preguntes lo que ya está respondido ahí; úsalo para hacer preguntas mejores.

## Paso 1 — Reformular

En 2 o 3 líneas, di lo que entendiste del feature y qué problema resuelve para el médico. Si algo contradice `CLAUDE.md` (por ejemplo, escribir datos clínicos cuando el visor es de solo lectura), señálalo desde ya.

## Paso 2 — Preguntar para eliminar la ambigüedad

Haz preguntas en **rondas cortas de 2 a 4 preguntas**, las más importantes primero. Usa la herramienta `AskUserQuestion` cuando las respuestas se puedan expresar como opciones; propón una opción recomendada cuando tengas una. Después de cada ronda, resume lo que quedó claro y decide si hace falta otra. Normalmente bastan 1 a 3 rondas: para cuando cada pregunta restante ya no cambiaría el approach.

Dimensiones a cubrir (solo las que sigan ambiguas):

- **Usuario y momento de uso**: ¿qué médico, en qué contexto (consulta externa, urgencias, hospitalización) y qué decisión toma con esto?
- **Resultado esperado**: ¿qué ve o puede hacer al terminar? ¿Cómo sabremos que funciona? (criterios de aceptación)
- **Datos**: ¿qué recursos FHIR del RDA alimentan el feature (`Condition`, `Observation`, `MedicationStatement`, `Encounter`…)? ¿Qué pasa si faltan datos o vienen incompletos?
- **Visualización**: ¿vive en la silueta del cuerpo, en una tarjeta, en un cuadro de tendencia o en el detalle de un sistema? ¿Qué interacción (hover, clic, filtro por fecha)?
- **Tiempo**: ¿muestra el estado actual, la evolución, o compara atenciones?
- **Reglas clínicas**: ¿hay rangos, umbrales o mapeos (CIE-10 → sistema) que deban validarse con personal clínico?
- **Alcance**: ¿qué queda explícitamente fuera de esta versión?
- **Restricciones**: privacidad (solo datos sintéticos), accesibilidad (color + texto), rendimiento, plazos.

Reglas:
- Una pregunta = una sola duda. Nada de preguntas dobles.
- No asumas en silencio: si decides un supuesto razonable, dilo como supuesto para que el usuario lo corrija.
- Si el feature es demasiado grande, propón dividirlo y haz brainstorming solo de la primera parte.

## Paso 3 — Resumen del objetivo

Antes de los approaches, presenta el objetivo ya aclarado:

```
Objetivo: <una frase>
Usuario / contexto: …
Datos (recursos FHIR): …
Criterios de aceptación:
- …
Fuera de alcance: …
Supuestos: …
Preguntas abiertas (no bloqueantes): …
```

## Paso 4 — Presentar 2 o 3 approaches

Cada approach debe ser realmente distinto (no variaciones del mismo). Para cada uno:

```
### Approach A — <nombre corto>
Qué es: 1-2 frases.
Cómo funciona: componentes / flujo principal, recursos FHIR que usa.
Ventajas: …
Desventajas / riesgos: …
Esfuerzo relativo: bajo / medio / alto
Cuándo elegirlo: …
```

Después, una tabla comparativa corta (esfuerzo, riesgo, valor para el médico, qué tan fácil es ampliarlo) y **tu recomendación** con la razón en una o dos frases.

Termina preguntando cuál approach elige (con `AskUserQuestion`, opción recomendada primero). Cuando el usuario elija, ofrece como siguiente paso escribir la especificación con el skill `design-spec` usando ese approach. Si la decisión afecta arquitectura, stack o dominio, ofrece registrarla en `CLAUDE.md`.
