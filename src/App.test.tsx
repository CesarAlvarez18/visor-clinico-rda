import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('muestra el título del visor', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Visor clínico RDA' })).toBeInTheDocument()
  })
})
