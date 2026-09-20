# Licencia de `anatomy.glb`

## Atribución

`anatomy.glb` es un derivado de **BodyParts3D**, base de datos de estructuras anatómicas de la **Database Center for Life Science (DBCLS)**, Japón (<http://lifesciencedb.jp/bp3d/>).

> BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International

Esta es la licencia vigente según la fuente oficial (README del 2025/02/25). BodyParts3D usó anteriormente CC BY-SA 2.1 Japón; esa licencia quedó reemplazada por **CC BY 4.0** — ver `docs/reference/bodyparts3d.md` para el detalle. CC BY 4.0 exige atribución, pero **no** exige compartir el derivado bajo la misma licencia (no hay cláusula "share-alike").

## Origen y versión

- Base de datos: BodyParts3D/Anatomography, Release 4.0 (2013/06/19).
- Conjunto usado: árbol PART-OF, mallas OBJ con reducción de polígonos al 99 % (`partof_BP3D_4.0_obj_99.zip`).
- Descargado el: 2026-09-20, desde la fuente oficial de DBCLS (`dbarchive.biosciencedbc.jp`).

## Qué se hizo (cambios respecto a la fuente)

- Se seleccionó un subconjunto de partes (uno o varios órganos/huesos/vasos por sistema corporal), documentado en `docs/reference/bodyparts3d.md` y `scripts/anatomy-parts.mjs`.
- Cada grupo (piel, esqueleto, un grupo por sistema) se armó uniendo las mallas OBJ de sus partes en una sola malla.
- Se recalcularon normales, se soldaron vértices duplicados y se simplificó la geometría (más agresivo en piel y esqueleto; menos en vasos y nervios, para no romper los tubos finos) con `meshoptimizer`.
- Se convirtieron ejes y unidades (milímetros con Z hacia arriba → metros con Y hacia arriba) y se comprimió con Meshopt (`EXT_meshopt_compression`) en formato glTF binario (.glb).
- El modelo no incluye datos clínicos ni de pacientes: es una anatomía genérica.

## Redistribución

Si `anatomy.glb` (o un derivado suyo) se redistribuye por separado del repositorio, debe llevar este archivo o una atribución equivalente, señalando que es un derivado de BodyParts3D bajo CC BY 4.0 y describiendo los cambios de la sección anterior.
