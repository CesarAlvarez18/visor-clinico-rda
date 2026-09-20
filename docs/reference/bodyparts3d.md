# BodyParts3D: origen, versión, licencia y tabla parte → grupo

Insumo de la vista 3D (`docs/plans/2026-09-20-modelo-3d-rda.md`, Tarea 8-9). Documenta de dónde salen las mallas del modelo anatómico y cómo se agrupan por sistema. La asignación anatómica está **pendiente de validación clínica**.

## Origen y versión

- **Base de datos**: BodyParts3D/Anatomography, Database Center for Life Science (DBCLS), Japón.
- **Sitio**: <http://lifesciencedb.jp/bp3d/>
- **Descarga oficial**: <https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html>
- **Versión de las mallas**: Release 4.0 (2013/06/19).
- **Conjunto usado**: árbol **PART-OF**, reducción de polígonos al 99 % — `partof_BP3D_4.0_obj_99.zip` (~62 MB). No se usó el árbol IS-A: el IS-A solo llega a sub-partes finas (p. ej. "segment of liver", "region of wall of heart") y **no trae una malla única para el órgano completo**; el PART-OF sí trae una malla por órgano compuesto (p. ej. `heart`, `liver`, `right lung`) ya unida, que es lo que necesita el contrato `system:<id>` de una sola pieza por sistema.
- **Fecha de descarga**: 2026-09-20.
- **Archivos descargados a `vendor/bodyparts3d/`** (ignorado por git): `partof_BP3D_4.0_obj_99.zip`, `partof_parts_list_e.txt` (tabla id ↔ nombre), `partof_element_parts.txt`, `partof_inclusion_relation_list.txt`, `README_e.html`. Los mismos archivos con prefijo `isa_` se descargaron solo para consultar el árbol IS-A al buscar partes que no existen en el PART-OF (ver "Limitaciones" abajo); no se usan en el script de construcción.

## Licencia

**Corrección respecto a `CLAUDE.md` y al spec/plan de este feature**: ambos decían "CC BY-SA 2.1 Japón". El `README_e.html` de la descarga oficial (sección "3. License", actualizada 2025/02/25) dice que la licencia vigente es **Creative Commons Attribution 4.0 International (CC BY 4.0)**, no CC BY-SA 2.1 JP. CC BY-SA 2.1 JP fue la licencia histórica del proyecto; DBCLS la cambió a CC BY 4.0. CC BY 4.0 **no exige compartir igual** (share-alike), solo atribución — esto resuelve la pregunta abierta del spec ("¿la licencia es compatible con la forma en que se piensa distribuir el visor?"): al no exigir share-alike, no obliga a licenciar el visor completo bajo la misma licencia, solo el modelo derivado.

Atribución exacta requerida por el README:

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

Esta es la atribución que debe usar `public/models/LICENSE.md` (Tarea 9) y el pie de la vista 3D (`BodyModel3D.tsx`), en vez del texto "CC BY-SA 2.1 JP" usado como marcador de posición antes de esta investigación. **Pendiente**: actualizar `CLAUDE.md` y el spec con esta corrección (Tarea 12).

## Contrato de nombres del modelo

Ver `src/components/Anatomy3D/classifyMesh.ts`. Un nodo raíz por grupo: `skin`, `skeleton`, `system:<BodySystemId>` (uno por cada uno de los 9 sistemas con `display: 'region'` en `src/rules/config/bodySystems.ts`).

## Tabla parte (BodyParts3D) → grupo

Fuente de verdad: `scripts/anatomy-parts.mjs` (los ids de abajo deben coincidir; si difieren, el script manda). Cada parte es una malla `<bp>.obj` completa del árbol PART-OF.

| Grupo | Partes (concepto FMA — id de representación — nombre) |
|---|---|
| `skin` | FMA7163 — BP10155 — skin |
| `skeleton` | FMA46565 skull · FMA52748 mandible · FMA52749 hyoid bone · FMA7480 rib cage · FMA7485 sternum · FMA24138 cervical vertebral column · FMA9140 thoracic vertebral column · FMA16203 lumbar vertebral column · FMA16202 sacrum · FMA16581 pelvic girdle · FMA24163/24164 skeleton of right/left pectoral girdle · FMA24486/24487 right/left patella · FMA79181/79182 skeleton of right/left hand proper |
| `system:cardiovascular` | FMA7088 heart · FMA3734 aorta · FMA3941/4058 right/left common carotid artery · FMA3953/4694 right/left subclavian artery · FMA22691/22692 right/left brachial artery · FMA14765/14766 right/left common iliac artery · FMA70249/70250 right/left femoral artery · FMA77380/77381 right/left popliteal artery |
| `system:respiratory` | FMA7394 trachea · FMA7309/7310 right/left lung |
| `system:nervous` | FMA50801 brain · FMA7647 spinal cord |
| `system:digestive` | FMA7131 esophagus · FMA7148 stomach · FMA7200 small intestine · FMA14545/14546/14547 ascending/transverse/descending colon · FMA14544 rectum |
| `system:hepatic` | FMA7197 liver · FMA7202 gallbladder |
| `system:renal` | FMA7204/7205 right/left kidney · FMA15900 urinary bladder |
| `system:endocrine` | FMA7198 pancreas · FMA15629/15630 right/left adrenal (suprarenal) gland |
| `system:musculoskeletal` | FMA23130/23131 right/left humerus · FMA23464/23465 right/left radius · FMA23467/23468 right/left ulna · FMA24474/24475 right/left femur · FMA24477/24478 right/left tibia · FMA24480/24481 right/left fibula |
| `system:reproductive` | FMA9600 prostate |

La tabla FMA (CIE-10 → sistema) de las reglas clínicas **no cambia**; esta tabla es solo geometría del modelo 3D.

## Limitaciones conocidas del conjunto de datos (no son errores de mapeo)

- **BodyParts3D modela un único adulto varón.** No existe malla de útero, ovario ni testículo en ningún árbol. El sistema reproductor se representa solo con la próstata, como región pélvica genérica (ya documentado en el spec: "El sistema reproductor se colorea como región pélvica genérica").
- **No hay malla de tiroides completa.** Ni el árbol IS-A ni el PART-OF traen un concepto "thyroid gland"; solo existen arterias y músculos con "thyroid" en el nombre (p. ej. "inferior thyroid artery", "sternothyroid"). El sistema endocrino queda representado por páncreas y glándulas suprarrenales.
- **No hay nervios periféricos de las extremidades** en la versión reducida al 99 % de ninguno de los dos árboles (se buscó "sciatic", "median", "femoral nerve", "brachial plexus", etc., sin resultado). Los únicos nervios presentes son ramas del nervio oftálmico (órbita/ojo), irrelevantes para el modelo de cuerpo completo. El sistema nervioso queda representado por cerebro y médula espinal; sin nervios periféricos visibles (la anatomía procedural sí los dibuja de forma ilustrativa, ya que no depende de datos reales).
- **No hay esqueleto del pie** como compuesto único en el árbol PART-OF (sí existe "skeleton of hand proper" para la mano). Los pies quedan sin huesos propios en el modelo real; cubiertos visualmente por la piel.
- **`aorta` (FMA3734) se usa completa** (no por separado "ascending/arch/descending/abdominal aorta") porque el compuesto ya une esos segmentos; usar ambos duplicaría geometría.

## Pendiente de validación clínica

La asignación de cada parte anatómica a su sistema (esta tabla) y el mapeo CIE-10 → sistema (`src/rules/config/`) son propuestas del prototipo y deben revisarlas personas con formación clínica antes de un uso real.
