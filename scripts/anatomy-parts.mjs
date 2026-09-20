// Tabla parte anatómica (BodyParts3D) → grupo del modelo 3D.
//
// Fuente: BodyParts3D 4.0, árbol PART-OF (composición anatómica: "el hígado
// es parte de"), descargado de la fuente oficial de DBCLS. Se usa el árbol
// PART-OF y no el IS-A porque solo el PART-OF define, para cada órgano
// completo (p. ej. "heart", "liver", "right lung"), qué mallas finas
// ("element file id", `FJ####.obj`) hay que unir para reconstruirlo; el IS-A
// solo llega a esas mismas sub-partes finas sin agruparlas por órgano.
//
// Cada entrada es { fma, name }: `fma` es el id de concepto FMA (Foundational
// Model of Anatomy) — la clave para resolver, vía
// vendor/bodyparts3d/partof_element_parts.txt, la lista de archivos
// `FJ####.obj` que hay que unir (ver scripts/anatomy-elements.mjs) — y
// `name` es el nombre en inglés tal como aparece en partof_parts_list_e.txt,
// solo para que la tabla se pueda leer.
//
// Ver docs/reference/bodyparts3d.md para el origen, la versión, la licencia
// y las limitaciones conocidas del conjunto de datos (pendiente de
// validación clínica).

/** @typedef {{ fma: string, name: string }} Part */

/** Piel: un único envolvente de cuerpo completo. */
export const SKIN = [{ fma: 'FMA7163', name: 'skin' }]

/**
 * Resto del esqueleto (sin los huesos largos de brazos y piernas, que van en
 * `system:musculoskeletal` para poder pintarlos con el nivel, CA-10).
 * No incluye los huesos del pie: BodyParts3D no trae un compuesto "esqueleto
 * del pie" en el árbol PART-OF (ver "Limitaciones conocidas" en el README).
 */
export const SKELETON = [
  { fma: 'FMA46565', name: 'skull' },
  { fma: 'FMA52748', name: 'mandible' },
  { fma: 'FMA52749', name: 'hyoid bone' },
  { fma: 'FMA7480', name: 'rib cage' },
  { fma: 'FMA7485', name: 'sternum' },
  { fma: 'FMA24138', name: 'cervical vertebral column' },
  { fma: 'FMA9140', name: 'thoracic vertebral column' },
  { fma: 'FMA16203', name: 'lumbar vertebral column' },
  { fma: 'FMA16202', name: 'sacrum' },
  { fma: 'FMA16581', name: 'pelvic girdle' },
  { fma: 'FMA24163', name: 'skeleton of right pectoral girdle' },
  { fma: 'FMA24164', name: 'skeleton of left pectoral girdle' },
  { fma: 'FMA24486', name: 'right patella' },
  { fma: 'FMA24487', name: 'left patella' },
  { fma: 'FMA79181', name: 'skeleton of right hand proper' },
  { fma: 'FMA79182', name: 'skeleton of left hand proper' },
]

/**
 * Grupos por sistema con estructura propia (`MODEL_SYSTEM_IDS` en
 * classifyMesh.ts). Las claves son exactamente `system:<BodySystemId>`, el
 * contrato de nombres que espera classifyMesh.ts.
 * @type {Record<string, Part[]>}
 */
export const SYSTEM_PARTS = {
  'system:cardiovascular': [
    { fma: 'FMA7088', name: 'heart' },
    { fma: 'FMA3734', name: 'aorta' },
    { fma: 'FMA3941', name: 'right common carotid artery' },
    { fma: 'FMA4058', name: 'left common carotid artery' },
    { fma: 'FMA3953', name: 'right subclavian artery' },
    { fma: 'FMA4694', name: 'left subclavian artery' },
    { fma: 'FMA22691', name: 'right brachial artery' },
    { fma: 'FMA22692', name: 'left brachial artery' },
    { fma: 'FMA14765', name: 'right common iliac artery' },
    { fma: 'FMA14766', name: 'left common iliac artery' },
    { fma: 'FMA70249', name: 'right femoral artery' },
    { fma: 'FMA70250', name: 'left femoral artery' },
    { fma: 'FMA77380', name: 'right popliteal artery' },
    { fma: 'FMA77381', name: 'left popliteal artery' },
  ],
  'system:respiratory': [
    { fma: 'FMA7394', name: 'trachea' },
    { fma: 'FMA7309', name: 'right lung' },
    { fma: 'FMA7310', name: 'left lung' },
  ],
  // Sin nervios periféricos de extremidades: no existen como malla en la
  // versión reducida al 99 % del conjunto de datos (ver limitaciones).
  'system:nervous': [
    { fma: 'FMA50801', name: 'brain' },
    { fma: 'FMA7647', name: 'spinal cord' },
  ],
  'system:digestive': [
    { fma: 'FMA7131', name: 'esophagus' },
    { fma: 'FMA7148', name: 'stomach' },
    { fma: 'FMA7200', name: 'small intestine' },
    { fma: 'FMA14545', name: 'ascending colon' },
    { fma: 'FMA14546', name: 'transverse colon' },
    { fma: 'FMA14547', name: 'descending colon' },
    { fma: 'FMA14544', name: 'rectum' },
  ],
  'system:hepatic': [
    { fma: 'FMA7197', name: 'liver' },
    { fma: 'FMA7202', name: 'gallbladder' },
  ],
  'system:renal': [
    { fma: 'FMA7204', name: 'right kidney' },
    { fma: 'FMA7205', name: 'left kidney' },
    { fma: 'FMA15900', name: 'urinary bladder' },
  ],
  // Sin tiroides: no existe como malla de glándula completa en el conjunto
  // de datos (solo arterias/músculos con "thyroid" en el nombre).
  'system:endocrine': [
    { fma: 'FMA7198', name: 'pancreas' },
    { fma: 'FMA15629', name: 'right adrenal gland' },
    { fma: 'FMA15630', name: 'left adrenal gland' },
  ],
  'system:musculoskeletal': [
    { fma: 'FMA23130', name: 'right humerus' },
    { fma: 'FMA23131', name: 'left humerus' },
    { fma: 'FMA23464', name: 'right radius' },
    { fma: 'FMA23465', name: 'left radius' },
    { fma: 'FMA23467', name: 'right ulna' },
    { fma: 'FMA23468', name: 'left ulna' },
    { fma: 'FMA24474', name: 'right femur' },
    { fma: 'FMA24475', name: 'left femur' },
    { fma: 'FMA24477', name: 'right tibia' },
    { fma: 'FMA24478', name: 'left tibia' },
    { fma: 'FMA24480', name: 'right fibula' },
    { fma: 'FMA24481', name: 'left fibula' },
  ],
  // Solo próstata: BodyParts3D modela un adulto varón (sin útero ni
  // ovarios). Se colorea como región pélvica genérica (ver spec).
  'system:reproductive': [{ fma: 'FMA9600', name: 'prostate' }],
}

/** Todos los grupos, con el mismo nombre de nodo que debe llevar el GLB. */
export const GROUPS = {
  skin: SKIN,
  skeleton: SKELETON,
  ...SYSTEM_PARTS,
}
