import type { Favorito } from '@/lib/types'
import { delay } from '@/lib/mocks/delay'
import { mockFavoritos, mockProdutos, withCategoria } from '@/lib/mocks/data'
import { ApiError, apiClient } from './client'
import { USE_MOCK } from './config'

export async function listFavoritos(usuarioId: number): Promise<Favorito[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Favorito[]>('/favoritos')
    return data
  }

  await delay()
  return mockFavoritos
    .filter((f) => f.usuarioId === usuarioId)
    .map((f) => {
      const produto = mockProdutos.find((p) => p.id === f.produtoId)
      return {
        ...f,
        produto: produto ? withCategoria(produto) : undefined,
      }
    })
}

export async function addFavorito(usuarioId: number, produtoId: number): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.post(`/favoritos/${produtoId}`)
    return
  }

  await delay()
  const exists = mockFavoritos.some(
    (f) => f.usuarioId === usuarioId && f.produtoId === produtoId,
  )
  if (exists) return
  if (!mockProdutos.some((p) => p.id === produtoId)) {
    throw new ApiError('NOT_FOUND', 'Produto não encontrado', 404)
  }
  mockFavoritos.push({
    usuarioId,
    produtoId,
    createdAt: new Date().toISOString(),
  })
}

export async function removeFavorito(usuarioId: number, produtoId: number): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.delete(`/favoritos/${produtoId}`)
    return
  }

  await delay()
  const idx = mockFavoritos.findIndex(
    (f) => f.usuarioId === usuarioId && f.produtoId === produtoId,
  )
  if (idx >= 0) mockFavoritos.splice(idx, 1)
}
