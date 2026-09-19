import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Bundle } from 'fhir/r4'
import hospitalizacion from '../../data/examples/paciente-01/hospitalizacion-2026-03-15.json'
import { parseBundle } from '../../fhir/parseBundle'
import { computeBodyState } from '../../rules/computeBodyState'
import { BodyMap } from './BodyMap'

const bodyState = computeBodyState(parseBundle(hospitalizacion as Bundle))

describe('BodyMap', () => {
  it('CA-1: dibuja los 12 sistemas como botones con su nivel en el nombre accesible', () => {
    render(<BodyMap bodyState={bodyState} onSelect={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(12)
    expect(screen.getByRole('button', { name: 'Respiratorio: Grave' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cardiovascular: Grave' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Endocrino / metabólico: Leve' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salud mental: Sin datos' })).toBeInTheDocument()
  })

  it('CA-4 / CA-17: "Sin datos" usa su propio estilo, distinto de "Normal", y el nivel se muestra como texto', () => {
    render(<BodyMap bodyState={bodyState} onSelect={() => {}} />)
    const nervous = screen.getByRole('button', { name: 'Nervioso: Sin datos' })
    expect(nervous).toHaveClass('level--no-data')
    expect(nervous).not.toHaveClass('level--normal')
    expect(nervous).toHaveTextContent('Sin datos')

    const respiratory = screen.getByRole('button', { name: 'Respiratorio: Grave' })
    expect(respiratory).toHaveClass('level--severe')
    expect(respiratory).toHaveTextContent('Grave')
  })

  it('muestra la leyenda con los cinco estados', () => {
    render(<BodyMap bodyState={bodyState} onSelect={() => {}} />)
    const legend = screen.getByRole('list', { name: /Leyenda/ })
    expect(legend).toHaveTextContent('Normal')
    expect(legend).toHaveTextContent('Leve')
    expect(legend).toHaveTextContent('Moderado')
    expect(legend).toHaveTextContent('Grave')
    expect(legend).toHaveTextContent('Sin datos')
  })

  it('CA-12 / CA-18: el clic y la tecla Enter seleccionan el sistema', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<BodyMap bodyState={bodyState} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: 'Respiratorio: Grave' }))
    expect(onSelect).toHaveBeenLastCalledWith('respiratory')

    screen.getByRole('button', { name: 'Digestivo: Sin datos' }).focus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenLastCalledWith('digestive')

    await user.click(screen.getByRole('button', { name: 'Salud mental: Sin datos' }))
    expect(onSelect).toHaveBeenLastCalledWith('mental')
  })

  it('marca como seleccionado el sistema indicado', () => {
    render(<BodyMap bodyState={bodyState} selectedSystemId="respiratory" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'Respiratorio: Grave' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Cardiovascular: Grave' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('CA-11: al pasar el cursor o enfocar muestra el tooltip con el motivo principal', async () => {
    const user = userEvent.setup()
    render(<BodyMap bodyState={bodyState} onSelect={() => {}} />)

    await user.hover(screen.getByRole('button', { name: 'Respiratorio: Grave' }))
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toBeVisible()
    expect(tooltip).toHaveTextContent('Respiratorio')
    expect(tooltip).toHaveTextContent('Grave')
    expect(tooltip).toHaveTextContent('J18.9 Neumonía, no especificada (complicación)')

    await user.unhover(screen.getByRole('button', { name: 'Respiratorio: Grave' }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    // La primera región en el orden de tabulación es el sistema nervioso.
    await user.tab()
    expect(screen.getByRole('button', { name: 'Nervioso: Sin datos' })).toHaveFocus()
    expect(screen.getByRole('tooltip')).toHaveTextContent('Sin diagnósticos asociados en esta atención')
  })
})
