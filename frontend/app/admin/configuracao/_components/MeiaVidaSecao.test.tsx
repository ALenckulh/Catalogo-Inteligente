import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MeiaVidaSecao } from './DecaimentoSecoes'

const linha = vi.hoisted(() => vi.fn())
vi.mock('@ant-design/charts', () => ({
  Line: (p: unknown) => {
    linha(p)
    return null
  },
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
afterEach(() => {
  cleanup()
  linha.mockClear()
})

function abrir({ lambda = 0.01, pausaDias = 60 } = {}) {
  const fn = { onChange: vi.fn(), onPausaChange: vi.fn() }
  render(<MeiaVidaSecao lambdaSalvo={0.01} lambda={lambda} pausaDias={pausaDias} {...fn} />)
  return fn
}
const tecla = (nome: string, key: string, code: number) =>
  fireEvent.keyDown(screen.getByRole('slider', { name: nome }), { key, keyCode: code, which: code })
type Ponto = { dia: number; valor: number; serie: string }
const dados = () => (linha.mock.lastCall![0] as { data: Ponto[] }).data

it('duas linhas, com o valor em dias', () => {
  abrir()
  expect(screen.getAllByRole('slider').map((s) => [s.getAttribute('aria-label'), s.getAttribute('aria-valuetext')])).toEqual([
    ['Meia-vida', '69 dias'],
    ['Pausa depois de contato ou compra', '60 dias'],
  ])
})

it('o teclado muda cada valor', () => {
  const fn = abrir()
  tecla('Meia-vida', 'ArrowRight', 39)
  expect(fn.onChange).toHaveBeenCalledWith(expect.closeTo(Math.LN2 / 70, 4))
  tecla('Pausa depois de contato ou compra', 'ArrowLeft', 37)
  expect(fn.onPausaChange).toHaveBeenCalledWith(55)
})

it('pausa 0 aparece como sem pausa', () => {
  abrir({ pausaDias: 0 })
  expect(screen.getByText('sem pausa')).toBeInTheDocument()
})

it('o λ fica na dica do valor', async () => {
  abrir()
  fireEvent.mouseEnter(screen.getByText('69 dias'))
  expect(await screen.findByText('λ 0,01000')).toBeInTheDocument()
})

it('a curva nova só aparece se a meia-vida mudou', () => {
  abrir()
  expect(new Set(dados().map((d) => d.serie)).size).toBe(1)
  cleanup()
  abrir({ lambda: 0.02 })
  expect(new Set(dados().map((d) => d.serie)).size).toBe(2)
})

it('"Com contato" muda a curva', () => {
  abrir()
  const aos200 = () => dados().find((d) => d.dia === 200)!.valor
  expect(aos200()).toBe(0)
  fireEvent.click(screen.getByText('Com contato'))
  expect(aos200()).toBeGreaterThan(0)
})
