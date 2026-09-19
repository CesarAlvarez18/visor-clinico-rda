import { formatDate, formatIsoDate } from './format'

describe('formatDate', () => {
  it('no retrocede un día con fechas sin hora', () => {
    expect(formatDate('1962-04-15')).toBe('15 de abril de 1962')
  })

  it('formatea fechas con hora y zona horaria', () => {
    expect(formatDate('2026-08-20T10:00:00-05:00')).toMatch(/20 de agosto de 2026/)
  })

  it('devuelve el texto original si no es una fecha y un aviso si falta', () => {
    expect(formatDate('no-fecha')).toBe('no-fecha')
    expect(formatDate(undefined)).toBe('fecha no registrada')
  })
})

describe('formatIsoDate', () => {
  it('recorta a YYYY-MM-DD', () => {
    expect(formatIsoDate('2026-08-20T10:00:00-05:00')).toBe('2026-08-20')
    expect(formatIsoDate(undefined)).toBe('sin fecha')
  })
})
