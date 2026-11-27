import { describe, expect, it } from 'vitest'
import { listAdminUsuarios } from './admin'

describe('listAdminUsuarios (mock)', () => {
  it('ordena por nome nos dois sentidos, misturando PF e PJ', async () => {
    const nomes = async (sort: string) =>
      (await listAdminUsuarios({ sort })).items.map((u) => u.nomeCompleto ?? u.razaoSocial ?? '')
    const asc = await nomes('nome,asc')
    expect(asc.length).toBeGreaterThan(1)
    expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b)))
    expect(await nomes('nome,desc')).toEqual([...asc].reverse())
  })

  it('filtra por status', async () => {
    const todos = await listAdminUsuarios()
    expect((await listAdminUsuarios({ ativo: true })).total).toBe(todos.total)
    expect((await listAdminUsuarios({ ativo: false })).total).toBe(0)
  })
})
