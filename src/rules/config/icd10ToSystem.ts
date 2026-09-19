// PENDIENTE DE VALIDACIÓN CLÍNICA.
//
// Mapeo de códigos CIE-10 a sistemas corporales por rangos de capítulos y
// bloques. Es una propuesta inicial para el prototipo; debe revisarla
// personal clínico antes de usarse con pacientes reales.
//
// Reglas de lectura:
// - Los rangos se comparan sobre el código normalizado sin punto (I10, I210, K703).
// - Se aplica el primer rango que contenga el código, en el orden de la lista,
//   así que los rangos más específicos van antes que los generales.
// - `minLevel` fija un nivel mínimo para los códigos del rango, aunque el rol
//   del diagnóstico en la atención sugiera uno menor.
// - Un código sin rango queda "sin sistema asignado" y se lista aparte.

import type { Level } from '../levels'
import type { BodySystemId } from './bodySystems'

export interface Icd10Range {
  /** Código inicial del rango, inclusive, sin punto (p. ej. "I00"). */
  from: string
  /** Código final del rango, inclusive, sin punto (p. ej. "I99"). Un rango de un solo código repite `from`. */
  to: string
  system: BodySystemId
  minLevel?: Level
  note?: string
}

export const ICD10_TO_SYSTEM: readonly Icd10Range[] = [
  // --- Rangos específicos (van antes que los capítulos completos) ---
  { from: 'I21', to: 'I22', system: 'cardiovascular', minLevel: 'severe', note: 'Infarto agudo de miocardio' },
  { from: 'I46', to: 'I46', system: 'cardiovascular', minLevel: 'severe', note: 'Paro cardíaco' },
  { from: 'I60', to: 'I64', system: 'nervous', minLevel: 'severe', note: 'Enfermedad cerebrovascular aguda' },
  { from: 'I65', to: 'I69', system: 'nervous', note: 'Enfermedad cerebrovascular crónica y secuelas' },
  { from: 'K70', to: 'K77', system: 'hepatic', note: 'Enfermedades del hígado' },
  { from: 'K80', to: 'K83', system: 'hepatic', note: 'Vesícula y vías biliares' },
  { from: 'B15', to: 'B19', system: 'hepatic', note: 'Hepatitis viral' },
  { from: 'E10', to: 'E14', system: 'endocrine', note: 'Diabetes mellitus' },
  { from: 'N17', to: 'N17', system: 'renal', minLevel: 'severe', note: 'Insuficiencia renal aguda' },
  { from: 'N18', to: 'N19', system: 'renal', note: 'Enfermedad renal crónica' },
  { from: 'N40', to: 'N51', system: 'reproductive', note: 'Órganos genitales masculinos' },
  { from: 'N60', to: 'N64', system: 'reproductive', note: 'Mama' },
  { from: 'N70', to: 'N98', system: 'reproductive', note: 'Órganos genitales femeninos' },
  { from: 'J96', to: 'J96', system: 'respiratory', minLevel: 'severe', note: 'Insuficiencia respiratoria' },
  { from: 'A40', to: 'A41', system: 'hematologic', minLevel: 'severe', note: 'Sepsis' },
  { from: 'C81', to: 'C96', system: 'hematologic', minLevel: 'moderate', note: 'Neoplasias de tejido linfático y hematopoyético' },

  // --- Capítulos ---
  { from: 'A00', to: 'A09', system: 'digestive', note: 'Infecciones intestinales' },
  { from: 'A15', to: 'A16', system: 'respiratory', note: 'Tuberculosis respiratoria' },
  { from: 'B20', to: 'B24', system: 'hematologic', note: 'VIH' },
  { from: 'D50', to: 'D89', system: 'hematologic', note: 'Sangre, órganos hematopoyéticos e inmunidad' },
  { from: 'E00', to: 'E90', system: 'endocrine', note: 'Endocrinas, nutricionales y metabólicas' },
  { from: 'F00', to: 'F99', system: 'mental', note: 'Trastornos mentales y del comportamiento' },
  { from: 'G00', to: 'G99', system: 'nervous', note: 'Sistema nervioso' },
  { from: 'I00', to: 'I99', system: 'cardiovascular', note: 'Sistema circulatorio' },
  { from: 'J00', to: 'J99', system: 'respiratory', note: 'Sistema respiratorio' },
  { from: 'K00', to: 'K93', system: 'digestive', note: 'Sistema digestivo' },
  { from: 'L00', to: 'L99', system: 'integumentary', note: 'Piel y tejido subcutáneo' },
  { from: 'M00', to: 'M99', system: 'musculoskeletal', note: 'Sistema osteomuscular y tejido conjuntivo' },
  { from: 'N00', to: 'N39', system: 'renal', note: 'Sistema urinario' },
  { from: 'O00', to: 'O99', system: 'reproductive', note: 'Embarazo, parto y puerperio' },
  { from: 'S00', to: 'T14', system: 'musculoskeletal', note: 'Traumatismos (asignación provisional)' },
]
