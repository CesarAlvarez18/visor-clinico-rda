import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Bundle } from 'fhir/r4'
import hospitalizacion from '../../data/examples/paciente-01/hospitalizacion-2026-03-15.json'
import { parseBundle } from '../../fhir/parseBundle'
import { computeBodyState } from '../../rules/computeBodyState'
import { SystemList } from './SystemList'

const bodyState = computeBodyState(parseBundle(hospitalizacion as Bundle))

describe('SystemList', () => {
  it('lista los 9 sistemas del modelo con su nivel en texto', () => {
    render(<SystemList bodyState={bodyState} onHighlight={() => {}} onSelect={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(9)
    expect(screen.getByRole('button', { name: /Respiratorio/ })).toHaveTextContent('Grave')
    expect(screen.getByRole('button', { name: /Digestivo/ })).toHaveTextContent('Sin datos')
  })

  it('el foco resalta el sistema y el clic lo selecciona', async () => {
    const user = userEvent.setup()
    const onHighlight = vi.fn()
    const onSelect = vi.fn()
    render(<SystemList bodyState={bodyState} onHighlight={onHighlight} onSelect={onSelect} />)

    screen.getByRole('button', { name: /Respiratorio/ }).focus()
    expect(onHighlight).toHaveBeenLastCalledWith('respiratory')

    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenLastCalledWith('respiratory')
  })

  it('marca como presionado el sistema seleccionado', () => {
    render(<SystemList bodyState={bodyState} selectedSystemId="hepatic" onHighlight={() => {}} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /Hepático/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Renal/ })).toHaveAttribute('aria-pressed', 'false')
  })
})
