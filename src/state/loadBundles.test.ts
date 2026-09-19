import consulta1 from '../data/examples/paciente-01/consulta-2025-11-03.json'
import urgencias from '../data/examples/paciente-01/urgencias-2026-03-14.json'
import hospitalizacion from '../data/examples/paciente-01/hospitalizacion-2026-03-15.json'
import consulta2 from '../data/examples/paciente-01/consulta-2026-08-20.json'
import otroPaciente from '../data/examples/paciente-02/consulta-2026-05-02.json'
import invalido from '../data/examples/invalido.json'
import { BundleLoadError, buildHistory, readJsonFiles } from './loadBundles'

describe('buildHistory', () => {
  it('ordena las atenciones de la más reciente a la más antigua', () => {
    const history = buildHistory([
      { name: 'a', data: consulta1 },
      { name: 'b', data: hospitalizacion },
      { name: 'c', data: consulta2 },
      { name: 'd', data: urgencias },
    ])
    expect(history.patient.name).toBe('Paciente Prueba Uno')
    expect(history.encounters.map((e) => e.encounter.id)).toEqual([
      'enc-p1-2026-08-20',
      'enc-p1-2026-03-15',
      'enc-p1-2026-03-14',
      'enc-p1-2025-11-03',
    ])
  })

  it('CA-2: rechaza todo el conjunto si un archivo no es un documento RDA', () => {
    expect(() => buildHistory([{ name: 'ok.json', data: consulta1 }, { name: 'invalido.json', data: invalido }])).toThrow(
      BundleLoadError,
    )
    expect(() => buildHistory([{ name: 'invalido.json', data: invalido }])).toThrow(/invalido\.json/)
  })

  it('CA-3: rechaza Bundles de pacientes distintos', () => {
    expect(() => buildHistory([{ name: 'a', data: consulta1 }, { name: 'b', data: otroPaciente }])).toThrow(
      /pacientes distintos/,
    )
  })

  it('rechaza una carga vacía', () => {
    expect(() => buildHistory([])).toThrow(/ningún archivo/)
  })
})

describe('readJsonFiles', () => {
  it('lee el contenido JSON de cada archivo', async () => {
    const file = new File([JSON.stringify(consulta1)], 'consulta.json', { type: 'application/json' })
    const inputs = await readJsonFiles([file])
    expect(inputs[0].name).toBe('consulta.json')
    expect((inputs[0].data as { resourceType: string }).resourceType).toBe('Bundle')
  })

  it('falla con un mensaje claro si un archivo no es JSON', async () => {
    const file = new File(['{no es json'], 'roto.json', { type: 'application/json' })
    await expect(readJsonFiles([file])).rejects.toThrow(/roto\.json no es un archivo JSON válido/)
  })
})
