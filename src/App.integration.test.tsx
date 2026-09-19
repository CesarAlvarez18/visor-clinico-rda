import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

async function loadPatient(name: string) {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name }))
  await waitFor(() => expect(screen.getByRole('heading', { name })).toBeInTheDocument())
  return user
}

describe('Integración: selector de atención', () => {
  it('CA-15: cambiar de atención actualiza silueta, "Viendo", triage y el panel abierto', async () => {
    const user = await loadPatient('Paciente Prueba Uno')

    // Por defecto, la última consulta: cardiovascular Moderado y sin triage.
    expect(screen.getByRole('button', { name: 'Cardiovascular: Moderado' })).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: /triage/i })).not.toBeInTheDocument()

    // Abrir el panel del cardiovascular.
    await user.click(screen.getByRole('button', { name: 'Cardiovascular: Moderado' }))
    expect(screen.getByRole('heading', { name: 'Cardiovascular' })).toBeInTheDocument()
    expect(screen.getByText(/Nivel:/)).toHaveTextContent('Moderado')

    // Elegir la atención de urgencias.
    const select = screen.getByLabelText('Atención')
    const options = within(select).getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual([
      'Consulta externa · 2026-08-20 · IPS Consulta Ejemplo',
      'Hospitalización · 2026-03-15 · Hospital San Ejemplo',
      'Urgencias · 2026-03-14 · Hospital San Ejemplo',
      'Consulta externa · 2025-11-03 · IPS Consulta Ejemplo',
    ])
    await user.selectOptions(select, 'Urgencias · 2026-03-14 · Hospital San Ejemplo')

    expect(screen.getByText(/Viendo:/).closest('p')).toHaveTextContent('Urgencias')
    expect(screen.getByRole('status', { name: 'Clasificación de triage: Triage II' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cardiovascular: Grave' })).toBeInTheDocument()

    // El panel sigue abierto en el mismo sistema, con los datos de urgencias.
    expect(screen.getByRole('heading', { name: 'Cardiovascular' })).toBeInTheDocument()
    expect(screen.getByText(/Nivel:/)).toHaveTextContent('Grave')
    expect(screen.getByRole('list', { name: 'Diagnósticos del sistema' })).toHaveTextContent('I21.0')
    expect(screen.getByText(/Se muestra solo lo registrado/)).toHaveTextContent('Urgencias')
  })

  it('CA-13 / CA-14: el panel cambia de sistema sin cerrarse y se cierra con Escape', async () => {
    const user = await loadPatient('Paciente Prueba Uno')
    await user.click(screen.getByRole('button', { name: 'Cardiovascular: Moderado' }))
    await user.click(screen.getByRole('button', { name: 'Salud mental: Leve' }))
    expect(screen.getByRole('heading', { name: 'Salud mental' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Cardiovascular' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salud mental: Leve' })).toHaveAttribute('aria-pressed', 'true')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('heading', { name: 'Salud mental' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salud mental: Leve' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('CA-16: con una sola atención el selector queda deshabilitado', async () => {
    await loadPatient('Paciente Prueba Dos')
    const select = screen.getByLabelText('Atención')
    expect(select).toBeDisabled()
    expect(within(select).getAllByRole('option')).toHaveLength(1)
    expect(screen.getByText('Única atención cargada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Respiratorio: Moderado' })).toBeInTheDocument()
  })

  it('CA-9: los diagnósticos sin sistema se listan y desaparecen al cambiar de atención', async () => {
    const user = await loadPatient('Paciente Prueba Uno')
    expect(screen.getByRole('heading', { name: 'Diagnósticos sin sistema asignado' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Atención'), 'Consulta externa · 2025-11-03 · IPS Consulta Ejemplo')
    expect(screen.queryByRole('heading', { name: 'Diagnósticos sin sistema asignado' })).not.toBeInTheDocument()
  })
})
