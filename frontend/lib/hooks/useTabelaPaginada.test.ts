import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Page } from '@/lib/types'
import { useTabelaPaginada } from './useTabelaPaginada'

const pagina = (items: number[], total: number, page: number): Page<number> => ({ items, total, page, limit: 20 })

/** Servidor falso com `total` registros, devolvendo só a página pedida. */
const servidor = (total: number) =>
  vi.fn(async ({ page, limit }: { page: number; limit: number; sort?: string }) => {
    const inicio = (page - 1) * limit
    const items = Array.from({ length: Math.max(0, Math.min(limit, total - inicio)) }, (_, i) => inicio + i + 1)
    return pagina(items, total, page)
  })

describe('useTabelaPaginada', () => {
  it('chega à última página com mais de 100 registros', async () => {
    const buscar = servidor(150)
    const { result } = renderHook(() => useTabelaPaginada(buscar, true))
    await waitFor(() => expect(result.current.pagination.total).toBe(150))

    act(() => result.current.setPage(8))
    await waitFor(() => expect(result.current.items).toEqual([141, 142, 143, 144, 145, 146, 147, 148, 149, 150]))
  })

  it('não busca enquanto desabilitado', async () => {
    const buscar = servidor(5)
    renderHook(() => useTabelaPaginada(buscar, false))
    await new Promise((r) => setTimeout(r, 20))
    expect(buscar).not.toHaveBeenCalled()
  })

  it('ordenar manda o sort ao servidor e volta para a página 1', async () => {
    const buscar = servidor(150)
    const { result } = renderHook(() => useTabelaPaginada(buscar, true))
    act(() => result.current.setPage(3))
    await waitFor(() => expect(result.current.items[0]).toBe(41))

    act(() => result.current.onTableChange({ current: 3 }, { field: 'nome', order: 'descend' }, false))
    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith({ page: 1, limit: 20, sort: 'nome,desc' }))
    expect(result.current.sortOrder('nome')).toBe('descend')
    expect(result.current.pagination.current).toBe(1)
  })

  it('trocar de página mantém a ordenação e não volta para a 1', async () => {
    const buscar = servidor(150)
    const { result } = renderHook(() => useTabelaPaginada(buscar, true))
    act(() => result.current.onTableChange({ current: 1 }, { field: 'nome', order: 'ascend' }, false))
    act(() => result.current.onTableChange({ current: 4 }, { field: 'nome', order: 'ascend' }, false))
    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith({ page: 4, limit: 20, sort: 'nome,asc' }))
  })

  it('página que deixou de existir vai direto para a última válida', async () => {
    const buscar = servidor(25)
    const { result } = renderHook(() => useTabelaPaginada(buscar, true))
    act(() => result.current.setPage(7))
    await waitFor(() => expect(result.current.items).toEqual([21, 22, 23, 24, 25]))
    expect(result.current.pagination.current).toBe(2)
    expect(buscar).toHaveBeenCalledTimes(2)
  })

  it('descarta resposta atrasada', async () => {
    const pendentes: ((p: Page<number>) => void)[] = []
    const buscar = vi.fn(() => new Promise<Page<number>>((resolve) => pendentes.push(resolve)))
    const { result } = renderHook(() => useTabelaPaginada<number>(buscar, true))
    await waitFor(() => expect(pendentes).toHaveLength(1))
    act(() => result.current.setPage(2))
    await waitFor(() => expect(pendentes).toHaveLength(2))

    await act(async () => pendentes[1](pagina([22], 40, 2)))
    await act(async () => pendentes[0](pagina([11], 40, 1)))
    expect(result.current.items).toEqual([22])
    expect(result.current.loading).toBe(false)
  })
})
