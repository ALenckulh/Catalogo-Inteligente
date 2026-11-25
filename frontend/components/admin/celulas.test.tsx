import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { AtivoTag, DataCelula, NotaCelula, TextoCelula } from './celulas'

afterEach(cleanup)

it.each([null, undefined, ''])('texto vazio (%s) vira travessão', (texto) => {
  render(<TextoCelula texto={texto} />)
  expect(screen.getByText('—')).toBeInTheDocument()
})

it('texto longo fica inteiro no DOM, na fonte de apoio', () => {
  const longo = 'Jogo completo de juntas '.repeat(10).trim()
  render(<TextoCelula texto={longo} linhas={2} />)
  expect(screen.getByText(longo)).toHaveStyle({ fontSize: 'var(--font-size-base)' })
})

it('principal fica na fonte do corpo', () => {
  render(<TextoCelula texto="Pistão" principal />)
  expect(screen.getByText('Pistão')).toHaveStyle({ fontSize: 'var(--font-size-lg)' })
})

it('com href, vira link', () => {
  render(<TextoCelula texto="Ana" href="/admin/usuarios/1" />)
  expect(screen.getByRole('link', { name: 'Ana' })).toHaveAttribute('href', '/admin/usuarios/1')
})

it('nota: valor com o nível, ou travessão sem nota (0 é nota)', () => {
  render(<NotaCelula nota={81.5} />)
  expect(screen.getByText('81.5')).toBeInTheDocument()
  render(<NotaCelula nota={0} />)
  expect(screen.getByText('0')).toBeInTheDocument()
  render(<NotaCelula nota={null} />)
  expect(screen.getByText('—')).toBeInTheDocument()
})

it('ativo e inativo', () => {
  render(<AtivoTag ativo />)
  render(<AtivoTag ativo={false} />)
  expect(screen.getByText('Ativo')).toBeInTheDocument()
  expect(screen.getByText('Inativo')).toBeInTheDocument()
})

it('data sem a hora, ou travessão', () => {
  render(<DataCelula data="2026-11-20T12:00:00Z" />)
  expect(screen.getByText('20/11/2026')).toBeInTheDocument()
  render(<DataCelula data={null} />)
  expect(screen.getByText('—')).toBeInTheDocument()
})
