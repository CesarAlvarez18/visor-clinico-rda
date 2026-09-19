import { mapIcd10, normalizeIcd10 } from './mapIcd10'
import { levelForRole } from './config/diagnosisRoleLevel'
import { worstLevel } from './levels'

describe('normalizeIcd10', () => {
  it('quita el punto y pasa a mayúsculas', () => {
    expect(normalizeIcd10('i10')).toBe('I10')
    expect(normalizeIcd10('I21.0')).toBe('I210')
    expect(normalizeIcd10(' k70.3 ')).toBe('K703')
  })
})

describe('mapIcd10', () => {
  it('asigna un código dentro de un capítulo a su sistema', () => {
    expect(mapIcd10('I10')?.system).toBe('cardiovascular')
    expect(mapIcd10('J44.9')?.system).toBe('respiratory')
    expect(mapIcd10('F32.1')?.system).toBe('mental')
    expect(mapIcd10('M54.5')?.system).toBe('musculoskeletal')
    expect(mapIcd10('L20.9')?.system).toBe('integumentary')
  })

  it('prefiere el rango específico sobre el capítulo', () => {
    expect(mapIcd10('K70.3')?.system).toBe('hepatic')
    expect(mapIcd10('K29.7')?.system).toBe('digestive')
    expect(mapIcd10('I63.9')?.system).toBe('nervous')
    expect(mapIcd10('E11.9')?.system).toBe('endocrine')
    expect(mapIcd10('N18.3')?.system).toBe('renal')
    expect(mapIcd10('N40')?.system).toBe('reproductive')
  })

  it('devuelve el nivel mínimo del rango cuando existe', () => {
    expect(mapIcd10('I21.0')).toMatchObject({ system: 'cardiovascular', minLevel: 'severe' })
    expect(mapIcd10('I25.2')?.minLevel).toBeUndefined()
    expect(mapIcd10('N17.9')?.minLevel).toBe('severe')
  })

  it('acepta subcódigos con y sin punto', () => {
    expect(mapIcd10('I210')?.system).toBe('cardiovascular')
    expect(mapIcd10('i21.0')?.system).toBe('cardiovascular')
  })

  it('deja sin sistema los códigos fuera del mapeo o mal formados', () => {
    expect(mapIcd10('Z00.0')).toBeUndefined()
    expect(mapIcd10('R50.9')).toBeUndefined()
    expect(mapIcd10('')).toBeUndefined()
    expect(mapIcd10(undefined)).toBeUndefined()
    expect(mapIcd10('sin-codigo')).toBeUndefined()
  })
})

describe('levelForRole', () => {
  it('asigna el nivel según el rol del diagnóstico', () => {
    expect(levelForRole('263718001')).toMatchObject({ level: 'severe' })
    expect(levelForRole('16100001')).toMatchObject({ level: 'severe' })
    expect(levelForRole('52870002')).toMatchObject({ level: 'moderate' })
    expect(levelForRole('89100005')).toMatchObject({ level: 'moderate' })
    expect(levelForRole('8319008')).toMatchObject({ level: 'moderate' })
    expect(levelForRole('398192003')).toMatchObject({ level: 'mild' })
  })

  it('usa Leve con motivo explícito cuando no hay rol o no se reconoce', () => {
    expect(levelForRole(undefined)).toEqual({ level: 'mild', reason: 'rol no registrado' })
    expect(levelForRole('999')).toMatchObject({ level: 'mild', reason: 'rol no reconocido (999)' })
  })
})

describe('worstLevel', () => {
  it('devuelve el peor de dos niveles', () => {
    expect(worstLevel('mild', 'severe')).toBe('severe')
    expect(worstLevel('moderate', 'mild')).toBe('moderate')
    expect(worstLevel('normal', 'normal')).toBe('normal')
  })
})
