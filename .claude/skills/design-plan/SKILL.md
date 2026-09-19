---
name: design-plan
description: Genera el plan de implementación de un feature a partir de un spec aprobado, en docs/plans/YYYY-MM-DD-title.md, con objetivo, contexto del problema, spec de referencia y la lista detallada de tareas. Úsalo cuando el usuario aprueba un spec de docs/specs/ (normalmente al pasar el approval gate de design-spec) o pide "haz el plan", "pasemos al plan", "plan de implementación". NO usar si no hay un spec aprobado (primero usar design-spec), ni para escribir el código.
---

# Design plan (plan de implementación)

Objetivo: convertir un spec aprobado en una lista ordenada de tareas concretas que se puedan implementar y verificar una por una. Este skill **no escribe código**.

## Antes de planear

1. **Ubica el spec.** Usa el que se acaba de aprobar en la conversación o búscalo en `docs/specs/`. Si hay varios candidatos, pregunta cuál.
2. **Verifica que esté aprobado** (`Estado: aprobado`). Si sigue en borrador, no continúes: ofrece volver al approval gate de `design-spec`.
3. **Lee `CLAUDE.md`** (stack, convenciones, principios, normativa, decisiones pendientes) y **revisa el código existente** para reutilizar lo que ya hay y ubicar dónde van los cambios.
4. **Decisiones técnicas bloqueantes.** Si el plan depende de algo no decidido (p. ej. stack, cómo se obtienen los RDA), propón 2 o 3 opciones con una recomendada usando `AskUserQuestion`. Registra en `CLAUDE.md` lo que el usuario decida.

## Nombre y ubicación del archivo

- Ruta: `docs/plans/YYYY-MM-DD-title.md` (crear la carpeta si no existe).
- `YYYY-MM-DD`: fecha de hoy. `title`: el mismo `title` del spec, para que spec y plan se emparejen fácilmente (en kebab-case, minúsculas, sin tildes ni ñ).

## Plantilla

```markdown
# Plan: <Título del feature>

- Fecha: YYYY-MM-DD
- Estado: pendiente
- Spec: [docs/specs/YYYY-MM-DD-title.md](../specs/YYYY-MM-DD-title.md)

## 1. Objetivo
Qué quedará funcionando al terminar el plan, en 2 a 4 líneas, en términos
del médico y alineado con el Overview del spec.

## 2. Contexto del problema
Resumen breve del problema (del spec) más el contexto técnico relevante:
estado actual del código, recursos FHIR del RDA involucrados, restricciones
(solo lectura, datos sintéticos, accesibilidad) y decisiones técnicas tomadas.

## 3. Spec de referencia
- Enlace al spec.
- Criterios de aceptación del spec que este plan cubre (numerados, p. ej. CA-1, CA-2…).
- Lo que queda fuera de alcance (copiado del spec).

## 4. Tareas

### Tarea 1 — <nombre corto>
- **Qué**: descripción de lo que se construye o cambia.
- **Por qué**: qué parte del spec cubre (CA-x / flujo / fila de errores y mitigaciones).
- **Archivos**: archivos a crear o modificar (rutas).
- **Detalles**: pasos, componentes, recursos FHIR y campos usados, reglas a aplicar.
- **Depende de**: tareas previas o "ninguna".
- **Verificación**: pruebas a escribir y cómo comprobar que está lista.
- [ ] Hecha

### Tarea 2 — …

## Riesgos y preguntas abiertas
- …
```

## Reglas para las tareas

- **Orden**: por dependencias; primero lo que habilita lo demás (datos de ejemplo sintéticos, lectura/parseo del RDA, modelo de datos), luego lógica, luego interfaz, luego pulido.
- **Tamaño**: cada tarea debe poder hacerse y verificarse en una sesión corta. Si es más grande, divídela.
- **Trazabilidad**: todo criterio de aceptación y toda mitigación de la sección 6 del spec debe quedar cubierto por al menos una tarea. Al final revisa esa cobertura y dilo explícitamente.
- **Verificable**: cada tarea tiene su verificación (pruebas automatizadas cuando aplique).
- **Sin inventar reglas clínicas**: rangos, umbrales o mapeos CIE-10 no validados se implementan como configuración y se marcan como pendientes de validación clínica.
- **Datos**: solo datos sintéticos conformes a la guía RDA para desarrollo y pruebas.

## Al terminar

1. Escribe el archivo y muestra la ruta con un resumen: número de tareas, orden general y riesgos principales.
2. Pide revisión; itera hasta que el usuario lo apruebe y entonces cambia `Estado: pendiente` por `Estado: aprobado`.
3. Ofrece empezar la implementación por la Tarea 1. Durante la implementación, marca `- [x] Hecha` en cada tarea completada.
4. Cuando todas las tareas estén hechas, usa el skill `verify-after-changes` para probar en el navegador y dar luz verde.
