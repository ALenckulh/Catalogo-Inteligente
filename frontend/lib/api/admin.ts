import type {
  AdminDashboard,
  AdminUsuarioDetalhe,
  Compra,
  Page,
  ParametroDecay,
  PesoMetrica,
  Produto,
  ProdutoInput,
  Usuario,
} from '@/lib/types'
import { delay } from '@/lib/mocks/delay'
import {
  mockCategorias,
  mockCompras,
  mockDashboard,
  mockDecay,
  mockPesos,
  mockProdutos,
  mockUsuarios,
  withCategoria,
} from '@/lib/mocks/data'
import { ApiError, apiClient } from './client'
import { USE_MOCK } from './config'

export async function getDashboard(): Promise<AdminDashboard> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<AdminDashboard>('/admin/dashboard')
    return data
  }
  await delay()
  return structuredClone(mockDashboard)
}

export async function listAdminUsuarios(params?: {
  q?: string
  tipo?: string
  page?: number
  limit?: number
}): Promise<Page<Usuario>> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Page<Usuario>>('/admin/usuarios', { params })
    return data
  }
  await delay()
  let items = mockUsuarios.filter((u) => u.tipo !== 'ADMIN')
  if (params?.tipo) items = items.filter((u) => u.tipo === params.tipo)
  if (params?.q) {
    const term = params.q.toLowerCase()
    items = items.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        (u.nomeCompleto?.toLowerCase().includes(term) ?? false) ||
        (u.razaoSocial?.toLowerCase().includes(term) ?? false),
    )
  }
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const start = (page - 1) * limit
  return { items: items.slice(start, start + limit), page, limit, total: items.length }
}

export async function getAdminUsuario(id: number): Promise<AdminUsuarioDetalhe> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<AdminUsuarioDetalhe>(`/admin/usuarios/${id}`)
    return data
  }
  await delay()
  const user = mockUsuarios.find((u) => u.id === id)
  if (!user) throw new ApiError('NOT_FOUND', 'Usuário não encontrado', 404)
  const compras = mockCompras.filter((c) => c.usuarioId === id)
  return {
    usuario: { ...user },
    scoresProduto: mockProdutos.slice(0, 3).map((p, i) => ({
      produtoId: p.id,
      produtoNome: p.nome,
      valor: 87.5 - i * 12,
    })),
    scoresCategoria: mockCategorias.slice(0, 2).map((c, i) => ({
      categoriaId: c.id,
      categoriaNome: c.nome,
      valor: 70 - i * 8,
    })),
    faixaPreco: {
      medianaComConversao: 28.9,
      medianaSemConversao: 45.0,
      gapPreco: 16.1,
    },
    compras,
  }
}

export async function createCompra(
  usuarioId: number,
  body: Omit<Compra, 'id' | 'usuarioId' | 'produtoNome'>,
): Promise<Compra> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<Compra>(`/admin/usuarios/${usuarioId}/compras`, body)
    return data
  }
  await delay()
  const produto = mockProdutos.find((p) => p.id === body.produtoId)
  const compra: Compra = {
    id: mockCompras.length + 1,
    usuarioId,
    produtoNome: produto?.nome,
    ...body,
  }
  mockCompras.push(compra)
  return compra
}

export async function listAdminProdutos(params?: {
  q?: string
  page?: number
  limit?: number
}): Promise<Page<Produto>> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Page<Produto>>('/admin/produtos', { params })
    return data
  }
  await delay()
  let items = mockProdutos.map(withCategoria)
  if (params?.q) {
    const term = params.q.toLowerCase()
    items = items.filter((p) => p.nome.toLowerCase().includes(term) || p.slug.includes(term))
  }
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const start = (page - 1) * limit
  return { items: items.slice(start, start + limit), page, limit, total: items.length }
}

export async function getAdminProduto(id: number): Promise<Produto> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Produto>(`/admin/produtos/${id}`)
    return data
  }
  await delay()
  const produto = mockProdutos.find((p) => p.id === id)
  if (!produto) throw new ApiError('NOT_FOUND', 'Produto não encontrado', 404)
  return withCategoria(produto)
}

export async function createProduto(body: ProdutoInput): Promise<Produto> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<Produto>('/admin/produtos', body)
    return data
  }
  await delay()
  const now = new Date().toISOString()
  const produto: Produto = {
    id: Math.max(0, ...mockProdutos.map((p) => p.id)) + 1,
    nome: body.nome,
    slug: body.slug,
    descricao: body.descricao ?? null,
    fichaTecnica: body.fichaTecnica ?? null,
    preco: body.preco,
    categoriaId: body.categoriaId,
    ativo: body.ativo,
    imagens: [],
    createdAt: now,
    updatedAt: now,
  }
  mockProdutos.push(produto)
  return withCategoria(produto)
}

export async function updateProduto(id: number, body: Partial<ProdutoInput>): Promise<Produto> {
  if (!USE_MOCK) {
    const { data } = await apiClient.patch<Produto>(`/admin/produtos/${id}`, body)
    return data
  }
  await delay()
  const produto = mockProdutos.find((p) => p.id === id)
  if (!produto) throw new ApiError('NOT_FOUND', 'Produto não encontrado', 404)
  Object.assign(produto, body, { updatedAt: new Date().toISOString() })
  return withCategoria(produto)
}

export async function deleteProduto(id: number): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.delete(`/admin/produtos/${id}`)
    return
  }
  await delay()
  const idx = mockProdutos.findIndex((p) => p.id === id)
  if (idx >= 0) mockProdutos.splice(idx, 1)
}

export async function getPesos(): Promise<PesoMetrica[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<PesoMetrica[]>('/admin/configuracao/pesos')
    return data
  }
  await delay()
  return structuredClone(mockPesos)
}

export async function savePesos(pesos: PesoMetrica[]): Promise<PesoMetrica[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.patch<PesoMetrica[]>('/admin/configuracao/pesos', { pesos })
    return data
  }
  await delay()
  mockPesos.splice(0, mockPesos.length, ...pesos)
  return structuredClone(mockPesos)
}

export async function getDecay(): Promise<ParametroDecay[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<ParametroDecay[]>('/admin/configuracao/decay')
    return data
  }
  await delay()
  return structuredClone(mockDecay)
}

export async function saveDecay(items: ParametroDecay[]): Promise<ParametroDecay[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.patch<ParametroDecay[]>('/admin/configuracao/decay', {
      items,
    })
    return data
  }
  await delay()
  mockDecay.splice(0, mockDecay.length, ...items)
  return structuredClone(mockDecay)
}

export async function updateAdminConta(
  patch: Partial<Pick<Usuario, 'telefone' | 'email'>>,
): Promise<Usuario> {
  if (!USE_MOCK) {
    const { data } = await apiClient.patch<Usuario>('/admin/conta', patch)
    return data
  }
  await delay()
  const admin = mockUsuarios.find((u) => u.tipo === 'ADMIN')
  if (!admin) throw new ApiError('NOT_FOUND', 'Admin não encontrado', 404)
  Object.assign(admin, patch, { updatedAt: new Date().toISOString() })
  return { ...admin }
}
