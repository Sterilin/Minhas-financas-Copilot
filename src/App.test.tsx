import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the finance dashboard shell and navigation', () => {
    render(<App />)

    expect(screen.getByText('Minhas Finanças')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resumo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comparativo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Parcelas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Metas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dados' })).toBeInTheDocument()
  })

  it('renders the summary page content with demonstration data', () => {
    render(<App />)

    expect(screen.getAllByText('Resumo').length).toBeGreaterThan(0)
    expect(screen.getByText('Saldo consolidado')).toBeInTheDocument()
    expect(screen.getByText('Patrimônio por conta')).toBeInTheDocument()
  })
})
