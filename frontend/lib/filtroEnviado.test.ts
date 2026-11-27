import { beforeEach, expect, it } from 'vitest'
import { registrarFiltro } from './filtroEnviado'

const f = (p: Partial<Parameters<typeof registrarFiltro>[0]>) => ({
  categoria: null,
  q: null,
  precoMin: null,
  precoMax: null,
  ...p,
})

beforeEach(() => window.sessionStorage.clear())

it('conta uma vez: recarregar ou voltar ao mesmo filtro não repete', () => {
  expect(registrarFiltro(f({ categoria: 5 }))).toEqual({ enviar: true, categoriaMudou: true })
  expect(registrarFiltro(f({ categoria: 5 })).enviar).toBe(false)
})

it('mudar preço ou texto envia sem somar de novo na categoria', () => {
  registrarFiltro(f({ categoria: 5 }))
  expect(registrarFiltro(f({ categoria: 5, precoMin: 10 }))).toEqual({ enviar: true, categoriaMudou: false })
  expect(registrarFiltro(f({ categoria: 5, precoMin: 10, q: 'x' }))).toEqual({ enviar: true, categoriaMudou: false })
  expect(registrarFiltro(f({ categoria: 6, precoMin: 10, q: 'x' }))).toEqual({ enviar: true, categoriaMudou: true })
})

it('limpar não envia, e filtrar de novo depois conta', () => {
  registrarFiltro(f({ categoria: 5 }))
  expect(registrarFiltro(f({})).enviar).toBe(false)
  expect(registrarFiltro(f({ categoria: 5 }))).toEqual({ enviar: true, categoriaMudou: true })
})

it('valor estragado no sessionStorage não quebra', () => {
  window.sessionStorage.setItem('ci_filtro_enviado', '{{')
  expect(registrarFiltro(f({ q: 'x' })).enviar).toBe(true)
})
