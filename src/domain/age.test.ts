import { ageAt } from './age'

describe('ageAt', () => {
  it('calcula la edad cumplida en una fecha', () => {
    expect(ageAt('1962-04-15', '2025-11-03T08:30:00-05:00')).toBe(63)
    expect(ageAt('1962-04-15', '2026-04-14')).toBe(63)
    expect(ageAt('1962-04-15', '2026-04-15')).toBe(64)
  })

  it('devuelve undefined con fechas inválidas o anteriores al nacimiento', () => {
    expect(ageAt('no-es-fecha', '2026-01-01')).toBeUndefined()
    expect(ageAt('2030-01-01', '2026-01-01')).toBeUndefined()
  })
})
