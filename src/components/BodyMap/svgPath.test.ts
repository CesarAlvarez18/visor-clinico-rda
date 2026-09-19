import { mirrorPath, symmetricPath } from './svgPath'

describe('mirrorPath', () => {
  it('refleja solo las coordenadas x respecto al eje', () => {
    expect(mirrorPath('M100 20 L120 40 C130 50 140 60 150 70 Z')).toBe('M200 20 L180 40 C170 50 160 60 150 70 Z')
  })

  it('conserva los subpaths', () => {
    expect(mirrorPath('M10 10 L20 10 Z M30 30 L40 30 Z')).toBe('M290 10 L280 10 Z M270 30 L260 30 Z')
  })
})

describe('symmetricPath', () => {
  it('vuelve por el lado derecho con los segmentos reflejados en orden inverso', () => {
    const d = symmetricPath(
      [150, 0],
      [
        { c1: [140, 0], c2: [130, 10], to: [130, 20] },
        { c1: [130, 30], c2: [140, 40], to: [150, 40] },
      ],
    )
    expect(d).toBe('M150 0 C140 0 130 10 130 20 C130 30 140 40 150 40 C160 40 170 30 170 20 C170 10 160 0 150 0 Z')
  })
})
