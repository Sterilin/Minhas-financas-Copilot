import { render, screen } from '@testing-library/react'
import App from './app/App'

describe('App Component', () => {
  it('renders initial setup wizard when no vault exists', () => {
    localStorage.clear()
    render(<App />)

    expect(screen.getByText('Configuração Inicial')).toBeInTheDocument()
    expect(screen.getByText('Bem-vindo ao Minhas Finanças')).toBeInTheDocument()
    expect(screen.getByText(/Importar histórico 2024–2026/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Inicializar Minhas Finanças/i })).toBeInTheDocument()
  })
})
