import type { Page, Produto, ProdutosQuery } from '@/lib/types'
import { delay } from '@/lib/mocks/delay'
import { mockProdutos, withCategoria } from '@/lib/mocks/data'
import { apiClient } from './client'
import { USE_MOCK } from './config'

export async function listProdutos(query: ProdutosQuery = {}): Promise<Page<Produto>> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Page<Produto>>('/produtos', { params: query })
    return data
  }

  await delay()
  let items = mockProdutos.filter((p) => p.ativo).map(withCategoria)

  if (query.destaque) {
    items = items.slice(0, 4)
  }
  if (query.categoria) {
    items = items.filter((p) => p.categoriaId === query.categoria)
  }
  if (query.q) {
    const term = query.q.toLowerCase()
    items = items.filter(
      (p) =>
        p.nome.toLowerCase().includes(term) ||
        (p.descricao?.toLowerCase().includes(term) ?? false),
    )
  }
  if (query.precoMin !== undefined) {
    items = items.filter((p) => p.preco >= query.precoMin!)
  }
  if (query.precoMax !== undefined) {
    items = items.filter((p) => p.preco <= query.precoMax!)
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 12
  const start = (page - 1) * limit
  const slice = items.slice(start, start + limit)

  return { items: slice, page, limit, total: items.length }
}

export async function getProdutoBySlug(slug: string): Promise<Produto | null> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Produto>(`/produtos/${slug}`)
    return data
  }

  await delay()
  const found = mockProdutos.find((p) => p.slug === slug && p.ativo)
  return found ? withCategoria(found) : null
}
