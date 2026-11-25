import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { ParametroDecay } from '@/lib/types'
import { CategoriasSecao } from './DecaimentoSecoes'

vi.mock('@ant-design/charts', () => ({ Line: () => null }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
afterEach(cleanup)

const decay = (p: Partial<ParametroDecay> = {}): ParametroDecay => ({
  categoriaId: null,
  categoriaNome: null,
  lambda: 0.01,
  boostConversao: 1,
  boostRecorrencia: 1,
  pausaDias: 60,
  ...p,
})
const MOTORES = decay({ categoriaId: 5, categoriaNome: 'Motores' })

function abrir(overrides: ParametroDecay[] = [], idsSalvos: number[] = []) {
  const fn = { onPesoChange: vi.fn(), onGlobalChange: vi.fn(), onOverrideChange: vi.fn(), onAdicionar: vi.fn(), onRemover: vi.fn() }
  render(
    <CategoriasSecao
      pesos={[{ tipoEvento: 'FILTRO_APLICADO', peso: 0.5 }, { tipoEvento: 'CONTATO_WHATSAPP', peso: 1 }]}
      global={decay()}
      overrides={overrides}
      idsSalvos={new Set(idsSalvos)}
      categorias={[{ id: 5, nome: 'Motores', slug: 'motores', parentId: null, descricao: null }]}
      {...fn}
    />,
  )
  return fn
}
const direita = (nome: string) => fireEvent.keyDown(screen.getByRole('slider', { name: nome }), { key: 'ArrowRight', keyCode: 39, which: 39 })

it('sem ajustes, três linhas e nenhuma tabela', () => {
  abrir()
  expect(screen.getAllByRole('slider').map((s) => s.getAttribute('aria-label'))).toEqual([
    'Peso de Filtrar por categoria',
    'Bônus de categoria',
    'Bônus de recorrência',
  ])
  expect(screen.queryByRole('table')).toBeNull()
  expect(screen.getByLabelText('Adicionar ajuste para uma categoria')).toBeInTheDocument()
})

it('cada linha muda o próprio valor', () => {
  const fn = abrir()
  direita('Peso de Filtrar por categoria')
  expect(fn.onPesoChange).toHaveBeenCalledWith('FILTRO_APLICADO', 0.55)
  direita('Bônus de categoria')
  expect(fn.onGlobalChange).toHaveBeenLastCalledWith({ boostConversao: 1.05 })
  direita('Bônus de recorrência')
  expect(fn.onGlobalChange).toHaveBeenLastCalledWith({ boostRecorrencia: 1.05 })
})

it('na tabela, cada campo muda o ajuste da categoria, e a lixeira remove', () => {
  const fn = abrir([MOTORES], [5])
  const campo = (nome: string, v: string) => fireEvent.change(screen.getByLabelText(nome), { target: { value: v } })
  campo('Bônus de categoria de Motores', '20')
  expect(fn.onOverrideChange).toHaveBeenLastCalledWith(5, { boostConversao: 1.2 })
  campo('Bônus de recorrência de Motores', '30')
  expect(fn.onOverrideChange).toHaveBeenLastCalledWith(5, { boostRecorrencia: 1.3 })
  campo('Meia-vida de Motores', '30')
  expect(fn.onOverrideChange).toHaveBeenLastCalledWith(5, { lambda: expect.closeTo(Math.LN2 / 30, 4) })
  fireEvent.click(screen.getByRole('button', { name: 'Remover ajuste de Motores' }))
  expect(fn.onRemover).toHaveBeenCalledWith(5)
  // Todas as categorias já têm ajuste: não há o que adicionar.
  expect(screen.queryByLabelText('Adicionar ajuste para uma categoria')).toBeNull()
})

it('só o ajuste ainda não gravado ganha o aviso', () => {
  abrir([MOTORES], [5])
  expect(screen.queryByLabelText('Ainda não salvo')).toBeNull()
  cleanup()
  abrir([MOTORES])
  expect(screen.getByLabelText('Ainda não salvo')).toBeInTheDocument()
})
