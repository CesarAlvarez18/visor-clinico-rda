# Bundles RDA sintéticos

Datos **ficticios** para desarrollo y pruebas. Nunca poner aquí datos reales de pacientes.

- Se generan con `node scripts/generate-examples.mjs`; editar el script, no los JSON.
- Estructura según la guía RDA v1.0.0 (ver `docs/reference/rda-codes.md`): `Bundle` de tipo `document`, `Composition` con todas las secciones obligatorias (las que el visor no usa van con `emptyReason`), `Patient`, `Encounter` con `diagnosis.use` y `rank`, `Condition` con CIE-10, `Practitioner`, `Organization` y, en urgencias, `Observation` de triage.
- No pasaron por un validador FHIR. Diferencias conocidas con los perfiles: faltan extensiones obligatorias de `Patient` (nacionalidad, etnia, discapacidad, zona de residencia) y de `Organization`/`Practitioner`.

| Archivo | Caso que cubre |
|---|---|
| `paciente-01/consulta-2025-11-03.json` | Un solo diagnóstico (I10): resto de sistemas "Sin datos" |
| `paciente-01/urgencias-2026-03-14.json` | Triage II; infarto (I21.0) como ingreso y alta; hipertensión como comorbilidad |
| `paciente-01/hospitalizacion-2026-03-15.json` | EPOC (comorbilidad) + neumonía (complicación) → respiratorio Grave; gastritis `resolved` |
| `paciente-01/consulta-2026-08-20.json` | Z00.0 sin mapeo a sistema; F32.1 solo en la sección, sin rol |
| `paciente-02/consulta-2026-05-02.json` | Otro paciente, para el error de "pacientes distintos" |
| `invalido.json` | Bundle de tipo `collection` sin `Composition`: debe rechazarse |
