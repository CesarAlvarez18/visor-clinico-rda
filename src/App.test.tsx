import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import invalido from './data/examples/invalido.json'

describe('App', () => {
  it('muestra la pantalla de carga al inicio', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Visor clínico RDA' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Paciente Prueba Uno' })).toBeInTheDocument()
  })

  it('CA-1 / CA-20: al cargar un ejemplo muestra encabezado, "Viendo" y la etiqueta de reglas', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Paciente Prueba Uno' }))

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Paciente Prueba Uno' })).toBeInTheDocument())
    expect(screen.getByText(/64 años/)).toBeInTheDocument()
    expect(screen.getByText(/Masculino/)).toBeInTheDocument()
    expect(screen.getByText(/CC 999999001/)).toBeInTheDocument()
    expect(screen.getByText(/Viendo:/).closest('p')).toHaveTextContent(/Consulta externa/)
    expect(screen.getByText(/Reglas pendientes de validación clínica/)).toBeInTheDocument()
    // La última consulta no es de urgencias: sin alerta de triage.
    expect(screen.queryByRole('status', { name: /triage/i })).not.toBeInTheDocument()
  })

  it('CA-2: un archivo inválido muestra el error y no el encabezado', async () => {
    const user = userEvent.setup()
    render(<App />)
    const file = new File([JSON.stringify(invalido)], 'invalido.json', { type: 'application/json' })
    await user.upload(screen.getByLabelText('Archivos RDA (JSON)'), file)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/invalido\.json no es un documento RDA/))
    expect(screen.queryByText(/Viendo:/)).not.toBeInTheDocument()
  })

  it('CA-3: Bundles de pacientes distintos muestran el error de pacientes distintos', async () => {
    const user = userEvent.setup()
    const [{ default: p1 }, { default: p2 }] = await Promise.all([
      import('./data/examples/paciente-01/consulta-2025-11-03.json'),
      import('./data/examples/paciente-02/consulta-2026-05-02.json'),
    ])
    render(<App />)
    await user.upload(screen.getByLabelText('Archivos RDA (JSON)'), [
      new File([JSON.stringify(p1)], 'p1.json', { type: 'application/json' }),
      new File([JSON.stringify(p2)], 'p2.json', { type: 'application/json' }),
    ])

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/pacientes distintos/))
  })
})
