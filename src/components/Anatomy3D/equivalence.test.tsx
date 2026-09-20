import { cleanup, render, screen } from '@testing-library/react'
import type { Bundle } from 'fhir/r4'
import { examplePatients, loadExampleBundles } from '../../data/examples'
import { parseBundle } from '../../fhir/parseBundle'
import { computeBodyState } from '../../rules/computeBodyState'
import { BODY_SYSTEMS } from '../../rules/config/bodySystems'
import type { BodyState } from '../../rules/types'
import { BodyMap } from '../BodyMap/BodyMap'
import { SystemChip } from '../BodyMap/SystemChip'
import { MODEL_SYSTEM_IDS } from './classifyMesh'
import { SystemList } from './SystemList'

const CHIP_SYSTEMS = BODY_SYSTEMS.filter((s) => s.display === 'chip')

/** { systemId: "Nombre: Nivel" } leídos de los botones con `data-system`. */
function levelsByButtonLabel(): Record<string, string> {
  const result: Record<string, string> = {}
  for (const button of screen.getAllByRole('button')) {
    const systemId = button.getAttribute('data-system')
    if (systemId) result[systemId] = button.getAttribute('aria-label') ?? ''
  }
  return result
}

/**
 * Equivalencia 2D / 3D (CA-6, mitigación "diferencias entre 2D y 3D"): para
 * cada Bundle de ejemplo, la silueta 2D (`BodyMap`) y la vista 3D
 * (`SystemList` + los chips que también usa 2D) deben mostrar el mismo texto
 * de nivel para cada uno de los 12 sistemas, porque ambas leen el mismo
 * `BodyState` calculado una sola vez por las reglas.
 */
describe('Equivalencia 2D / 3D', () => {
  const cases: { label: string; bodyState: BodyState }[] = []

  beforeAll(async () => {
    for (const patient of examplePatients) {
      const bundles = await loadExampleBundles(patient)
      bundles.forEach((bundle, i) => {
        cases.push({
          label: `${patient.label} · ${patient.files[i]}`,
          bodyState: computeBodyState(parseBundle(bundle as Bundle)),
        })
      })
    }
  })

  it('carga al menos un caso de cada uno de los tres pacientes de ejemplo', () => {
    expect(cases.length).toBeGreaterThanOrEqual(examplePatients.length)
  })

  it('BodyMap (2D) y SystemList + chips (3D) muestran el mismo nivel para los 12 sistemas, en cada atención de ejemplo', () => {
    for (const { label, bodyState } of cases) {
      cleanup()
      const { unmount: unmountMap } = render(<BodyMap bodyState={bodyState} onSelect={() => {}} />)
      const from2d = levelsByButtonLabel()
      unmountMap()

      cleanup()
      const { unmount: unmountModel } = render(
        <>
          <SystemList bodyState={bodyState} onHighlight={() => {}} onSelect={() => {}} />
          {CHIP_SYSTEMS.map((system) => (
            <SystemChip key={system.id} state={bodyState.systems[system.id]} selected={false} tooltipId="tooltip" onSelect={() => {}} onHover={() => {}} />
          ))}
        </>,
      )
      const from3d = levelsByButtonLabel()
      unmountModel()

      for (const system of BODY_SYSTEMS) {
        expect(from3d[system.id], `${label} — sistema "${system.id}" en la vista 3D`).toBe(from2d[system.id])
      }
      // Los 9 con estructura propia van en SystemList, los 3 restantes en los chips.
      expect(Object.keys(from3d).sort()).toEqual([...MODEL_SYSTEM_IDS, ...CHIP_SYSTEMS.map((s) => s.id)].sort())
    }
  })
})
