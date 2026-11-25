import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getDecay, getPesos } from '@/lib/api/admin'
import { PESOS_PADRAO, decayGlobal } from '@/lib/scoring'
import ProjetoPage from './page'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/hooks/useRequireAdmin', () => ({ useRequireAdmin: () => ({ isAdmin: true, loading: false }) }))
vi.mock('@/lib/api/admin', () => ({ getPesos: vi.fn(), getDecay: vi.fn() }))

beforeEach(() => {
  vi.mocked(getPesos).mockResolvedValue(PESOS_PADRAO)
  vi.mocked(getDecay).mockResolvedValue([decayGlobal([])])
})
afterEach(cleanup)

const grupo = async (nome: string) =>
  within(await screen.findByRole('list', { name: nome }))
    .getAllByRole('listitem')
    .map((i) => i.textContent)

it('explica os níveis antes do exemplo', async () => {
  render(<ProjetoPage />)
  await screen.findByText('Exemplo')
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
    'Quanto vale cada ação',
    'O que a nota significa',
    'Exemplo',
    'O interesse esfria com o tempo',
  ])
})

it('ações por grupo, da maior para a menor; peso 0 fica fora', async () => {
  render(<ProjetoPage />)
  expect(await grupo('Intenção de compra')).toEqual([
    expect.stringMatching(/^Chamar no WhatsApp.*\+39 pts$/),
    expect.stringMatching(/^Favoritar.*\+32 pts$/),
    expect.stringMatching(/^Comprar.*\+26 pts$/),
  ])
  expect(await grupo('Navegação')).toEqual([
    expect.stringMatching(/^Pesquisar e abrir.*\+11 pts$/),
    expect.stringMatching(/^Rolar a página.*até \+8 pts$/),
    expect.stringMatching(/^Tempo na página.*até \+5 pts$/),
    expect.stringMatching(/^Ver um produto.*\+3 pts$/),
  ])
  expect(await grupo('Diminui a nota')).toEqual([expect.stringMatching(/^Remover dos favoritos.*−3 pts$/)])
})

it('grupo sem nenhuma ação com peso não aparece', async () => {
  vi.mocked(getPesos).mockResolvedValue(
    PESOS_PADRAO.map((p) => (p.tipoEvento === 'DESFAVORITAR' ? { ...p, peso: 0 } : p)),
  )
  render(<ProjetoPage />)
  await screen.findByText('Navegação')
  expect(screen.queryByText('Diminui a nota')).not.toBeInTheDocument()
})

it('o resto da explicação fica no ícone de ajuda', async () => {
  render(<ProjetoPage />)
  fireEvent.mouseEnter(await screen.findByLabelText('Ajuda: Comprar'))
  expect(await screen.findByText(/^Soma a partir de 3 compras/)).toBeInTheDocument()
  expect(screen.queryByLabelText('Ajuda: Favoritar')).not.toBeInTheDocument()
})

it('falha ao carregar: um aviso só, e tentar de novo traz o conteúdo', async () => {
  vi.mocked(getPesos).mockRejectedValueOnce(new Error('rede'))
  render(<ProjetoPage />)
  expect(await screen.findAllByText('Não foi possível carregar')).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByText('Exemplo')).toBeInTheDocument()
})
