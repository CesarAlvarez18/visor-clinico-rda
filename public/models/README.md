# Modelo anatómico

La vista 3D del visor (conmutador **2D / 3D**, `src/components/Anatomy3D/BodyModel3D.tsx`) carga `anatomy.glb` de esta carpeta. Si el archivo no existe todavía, se muestra automáticamente una anatomía de marcador de posición hecha con primitivas (`proceduralAnatomy.ts`), con un aviso visible en la vista.

## Cómo se genera

`anatomy.glb` se genera con `npm run build:model` (`scripts/build-anatomy-glb.mjs`) a partir de las mallas de **BodyParts3D** (DBCLS, Japón). No se edita a mano ni se sube de otra fuente.

1. Descargar `partof_BP3D_4.0_obj_99.zip` de la fuente oficial y extraerlo en `vendor/bodyparts3d/obj/` (ver `docs/reference/bodyparts3d.md` para la URL exacta, la versión y por qué se usa el árbol PART-OF y no el IS-A).
2. `npm install` (trae `@gltf-transform/*` y `meshoptimizer` como devDependencies).
3. `npm run build:model`.

El script arma un GLB comprimido con **Meshopt** (sin Draco, para que Drei lo decodifique sin pedirle nada a un CDN externo), con un nodo por grupo: `skin`, `skeleton` y `system:<id>` por cada uno de los 9 sistemas con estructura propia. Ese es el contrato que espera `src/components/Anatomy3D/classifyMesh.ts` — ver ahí antes de tocar los nombres de grupo.

## Escala y ejes

La malla de BodyParts3D viene en milímetros con el eje Z hacia arriba; el script la convierte a metros con Y hacia arriba, de frente a +Z. Al cargar el GLB en la escena, `normalizeModel` (en `AnatomyScene.tsx`) ajusta además la estatura a 1.77 m y apoya los pies en y = 0.

## Licencia

`anatomy.glb` es un derivado de BodyParts3D, licenciado bajo **CC BY 4.0** (no CC BY-SA — ver la corrección de licencia en `docs/reference/bodyparts3d.md`). La atribución exacta y lo que cambió respecto a la fuente están en `LICENSE.md`, en esta misma carpeta; ese archivo viaja junto con `anatomy.glb` si el modelo se redistribuye.
