import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import type { LeadResumo } from '@/lib/types'
import { LeadsTabela } from './LeadsTabela'

afterEach(cleanup)

const lead = (p: Partial<LeadResumo>): LeadResumo => ({
  usuarioId: 1,
  nome: 'Ana',
  tipo: 'PF',
  email: 'a@b.c',
  telefone: null,
  scoreMaxProduto: 81.5,
  topCategoria: 'Motores',
  ultimaAtividade: null,
  proximaCompra: 'Pistão',
  ...p,
})

it('mostra os leads na ordem recebida, com link para o detalhe', () => {
  render(<LeadsTabela leads={[lead({}), lead({ usuarioId: 2, nome: 'Bia', proximaCompra: null })]} />)
  const links = screen.getAllByRole('link')
  expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
    ['Ana', '/admin/usuarios/1'],
    ['Bia', '/admin/usuarios/2'],
  ])
  expect(within(links[0].closest('tr')!).getByText('Pistão')).toBeInTheDocument()
  expect(within(links[1].closest('tr')!).getAllByText('—').length).toBe(1)
})

it('mostra só os 5 primeiros, sem a última atividade', () => {
  const leads = [1, 2, 3, 4, 5, 6].map((i) => lead({ usuarioId: i, nome: `C${i}`, ultimaAtividade: '2026-11-20T10:00:00Z' }))
  render(<LeadsTabela leads={leads} />)
  expect(screen.getAllByRole('link').map((l) => l.textContent)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5'])
  expect(screen.queryByText('Última atividade')).toBeNull()
})

it('sem leads, explica', () => {
  render(<LeadsTabela leads={[]} />)
  expect(screen.getByText('Nenhum cliente com nota ainda')).toBeInTheDocument()
})
