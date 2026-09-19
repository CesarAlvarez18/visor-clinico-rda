import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Bundle } from 'fhir/r4'
import hospitalizacion from '../data/examples/paciente-01/hospitalizacion-2026-03-15.json'
import consulta2 from '../data/examples/paciente-01/consulta-2026-08-20.json'
import { parseBundle } from '../fhir/parseBundle'
import { computeBodyState } from '../rules/computeBodyState'
import { SystemDetailPanel } from './SystemDetailPanel'
import { UnmappedDiagnoses } from './UnmappedDiagnoses'

const hosp = parseBundle(hospitalizacion as Bundle)
const hospState = computeBodyState(hosp)
const ctrl = parseBundle(consulta2 as Bundle)
const ctrlState = computeBodyState(ctrl)

describe('SystemDetailPanel', () => {
  it('CA-5: destaca el diagnóstico que determina el nivel y lista los demás', () => {
    render(<SystemDetailPanel state={hospState.systems.respiratory} encounter={hosp.encounter} onClose={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Respiratorio' })).toBeInTheDocument()
    expect(screen.getByText(/Nivel:/)).toHaveTextContent('Grave')

    const items = within(screen.getByRole('list', { name: 'Diagnósticos del sistema' })).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    const neumonia = items.find((li) => li.textContent?.includes('J18.9'))!
    expect(neumonia).toHaveClass('diagnosis--cause')
    expect(neumonia).toHaveTextContent('Determina el nivel')
    expect(neumonia).toHaveTextContent('complicación')
    expect(neumonia).toHaveTextContent('Aporta: Grave')
    expect(neumonia).toHaveTextContent('Médica Internista Ejemplo · Hospital San Ejemplo')
    expect(neumonia).toHaveTextContent(/en la atención del 15 de marzo de 2026/)

    const epoc = items.find((li) => li.textContent?.includes('J44.9'))!
    expect(epoc).not.toHaveClass('diagnosis--cause')
    expect(epoc).toHaveTextContent('Aporta: Leve')
    expect(epoc).toHaveTextContent('comorbilidades')
  })

  it('CA-8: un diagnóstico resuelto aparece como no activo', () => {
    render(<SystemDetailPanel state={hospState.systems.digestive} encounter={hosp.encounter} onClose={() => {}} />)
    expect(screen.getByText(/Nivel:/)).toHaveTextContent('Sin datos')
    const item = screen.getByRole('listitem')
    expect(item).toHaveClass('diagnosis--inactive')
    expect(item).toHaveTextContent('K29.7')
    expect(item).toHaveTextContent('Resuelto')
    expect(item).toHaveTextContent('No cuenta para el nivel · no activo')
  })

  it('CA-6: un diagnóstico sin rol dice "rol no registrado"', () => {
    render(<SystemDetailPanel state={ctrlState.systems.mental} encounter={ctrl.encounter} onClose={() => {}} />)
    const item = screen.getByRole('listitem')
    expect(item).toHaveTextContent('F32.1')
    expect(item).toHaveTextContent('rol no registrado')
    expect(item).toHaveTextContent('Aporta: Leve')
  })

  it('muestra el mensaje de "Sin datos" cuando no hay diagnósticos del sistema', () => {
    render(<SystemDetailPanel state={hospState.systems.nervous} encounter={hosp.encounter} onClose={() => {}} />)
    expect(screen.getByText('No hay diagnósticos asociados a este sistema en esta atención.')).toBeInTheDocument()
    expect(screen.getByText(/Se muestra solo lo registrado en esta atención/)).toHaveTextContent('Hospitalización')
  })

  it('CA-14: Escape y el botón de cerrar cierran el panel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<SystemDetailPanel state={hospState.systems.respiratory} encounter={hosp.encounter} onClose={onClose} />)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Cerrar panel' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('UnmappedDiagnoses', () => {
  it('CA-9: lista los códigos sin mapeo', () => {
    render(<UnmappedDiagnoses diagnoses={ctrlState.unmapped} />)
    expect(screen.getByRole('heading', { name: 'Diagnósticos sin sistema asignado' })).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Z00.0')
  })

  it('no muestra nada si todos los códigos tienen sistema', () => {
    const { container } = render(<UnmappedDiagnoses diagnoses={hospState.unmapped} />)
    expect(container).toBeEmptyDOMElement()
  })
})
