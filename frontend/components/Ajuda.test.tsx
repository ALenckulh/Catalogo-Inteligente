import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { EMPRESA } from '@/lib/config'
import { Ajuda } from './Ajuda'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

beforeEach(() => {
  render(<Ajuda />)
})
afterEach(cleanup)

const buscar = (valor: string) =>
  fireEvent.change(document.getElementById('ajuda-busca')!, { target: { value: valor } })

it('busca ignora acento e acha por palavra que não está no texto', () => {
  buscar('CODIGO nao')
  expect(screen.getByText('O código da senha não chegou ou não funciona')).toBeTruthy()
  expect(screen.queryByText('Como faço para comprar?')).toBeNull()
  buscar('boleto')
  expect(screen.getByText('Como faço para comprar?')).toBeTruthy()
})

it('busca também nos passos e nas observações', () => {
  buscar('spam')
  expect(screen.getByText('O código da senha não chegou ou não funciona')).toBeTruthy()
  buscar('compartilhado')
  expect(screen.getByText('Como saio da conta?')).toBeTruthy()
})

it('a resposta é um passo a passo numerado', () => {
  fireEvent.click(screen.getByText('Quero excluir minha conta'))
  const passos = screen.getByText(/confirme em “Excluir conta”/).closest('ol')!
  expect(passos.querySelectorAll('li')).toHaveLength(2)
})

it('sem resultado, mostra os canais e volta para todas', () => {
  buscar('xyz123')
  expect(screen.getByText(/Nenhuma resposta encontrada/)).toBeTruthy()
  expect(screen.getByText(EMPRESA.telefone)).toBeTruthy()
  fireEvent.click(screen.getByText('Ver todas as perguntas'))
  expect(screen.getByText('Quero excluir minha conta')).toBeTruthy()
})

it('cópia dos dados é pedida por e-mail', () => {
  fireEvent.click(screen.getByText('Quero uma cópia dos meus dados'))
  expect(screen.getByRole('link', { name: 'Pedir por e-mail' }).getAttribute('href')).toContain(
    `mailto:${EMPRESA.email}`,
  )
})
