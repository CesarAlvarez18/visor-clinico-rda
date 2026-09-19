import { render, screen } from '@testing-library/react'
import { TriageAlert } from './TriageAlert'

describe('TriageAlert', () => {
  it('CA-10: muestra la clase de triage con su descripción', () => {
    render(<TriageAlert triage={{ code: '02', display: 'Triage II' }} encounterKind="emergency" />)
    const alert = screen.getByRole('status', { name: 'Clasificación de triage: Triage II' })
    expect(alert).toHaveTextContent('Triage II')
    expect(alert).toHaveTextContent('Emergencia')
    expect(alert).not.toHaveTextContent(/no es de urgencias/)
  })

  it('no muestra nada sin triage', () => {
    const { container } = render(<TriageAlert encounterKind="emergency" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('avisa si el triage viene en una atención que no es de urgencias', () => {
    render(<TriageAlert triage={{ code: '04', display: 'Triage IV' }} encounterKind="ambulatory" />)
    expect(screen.getByRole('status')).toHaveTextContent(/no es de urgencias/)
  })
})
