import type {
  AdminDashboard,
  AdminUsuarioDetalhe,
  AdminUsuarioListItem,
  Compra,
  CompraInput,
  Page,
  ParametroDecay,
  PesoMetrica,
  Produto,
  ProdutoInput,
  SimulacaoResponse,
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
import { fromBackendPage, toBackendPage } from './pagination'
import { nivelDoScore, type NivelInteresse } from '@/lib/nivelInteresse'

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
  categoria?: string
  nivel?: NivelInteresse
  page?: number
  limit?: number
}): Promise<Page<AdminUsuarioListItem>> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Page<AdminUsuarioListItem>>('/admin/usuarios', {
      params: { ...params, page: toBackendPage(params?.page) },
    })
    return fromBackendPage(data)
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
  let enriched: AdminUsuarioListItem[] = items.map((u) => {
    const lead = mockDashboard.leads.find((l) => l.usuarioId === u.id)
    return {
      ...u,
      scoreMaxProduto: lead?.scoreMaxProduto ?? null,
      topCategoria: lead?.topCategoria ?? null,
      ultimaAtividade: lead?.ultimaAtividade ?? null,
      ativo: true,
    }
  })
  if (params?.categoria) {
    const cat = params.categoria.toLowerCase()
    enriched = enriched.filter((u) => u.topCategoria?.toLowerCase() === cat)
  }
  if (params?.nivel) {
    const nivel = params.nivel
    enriched = enriched.filter((u) => nivelDoScore(u.scoreMaxProduto) === nivel)
  }
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const start = (page - 1) * limit
  return {
    items: enriched.slice(start, start + limit),
    page,
    limit,
    total: enriched.length,
  }
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

export async function createCompra(usuarioId: number, body: CompraInput): Promise<Compra> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<Compra>(`/admin/usuarios/${usuarioId}/compras`, body)
    return data
  }
  await delay()
  const produto = mockProdutos.find((p) => p.id === body.produtoId)
  const compra: Compra = {
    id: Math.max(0, ...mockCompras.map((c) => c.id)) + 1,
    usuarioId,
    produtoNome: produto?.nome,
    ...body,
  }
  mockCompras.push(compra)
  return compra
}

export async function updateCompra(
  usuarioId: number,
  compraId: number,
  body: CompraInput,
): Promise<Compra> {
  if (!USE_MOCK) {
    const { data } = await apiClient.put<Compra>(
      `/admin/usuarios/${usuarioId}/compras/${compraId}`,
      body,
    )
    return data
  }
  await delay()
  const compra = mockCompras.find((c) => c.id === compraId && c.usuarioId === usuarioId)
  if (!compra) throw new ApiError('NOT_FOUND', 'Compra não encontrada', 404)
  const produto = mockProdutos.find((p) => p.id === body.produtoId)
  Object.assign(compra, body, { produtoNome: produto?.nome })
  return { ...compra }
}

export async function deleteCompra(usuarioId: number, compraId: number): Promise<void> {
  if (!USE_MOCK) {
    await apiClient.delete(`/admin/usuarios/${usuarioId}/compras/${compraId}`)
    return
  }
  await delay()
  const i = mockCompras.findIndex((c) => c.id === compraId && c.usuarioId === usuarioId)
  if (i >= 0) mockCompras.splice(i, 1)
}

export async function listAdminProdutos(params?: {
  q?: string
  page?: number
  limit?: number
}): Promise<Page<Produto>> {
  if (!USE_MOCK) {
    const { data } = await apiClient.get<Page<Produto>>('/admin/produtos', {
      params: { ...params, page: toBackendPage(params?.page) },
    })
    return fromBackendPage(data)
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

function mapImagens(
  produtoId: number,
  imagens: ProdutoInput['imagens'] | undefined,
): Produto['imagens'] {
  if (!imagens?.length) return []
  let nextId =
    Math.max(0, ...mockProdutos.flatMap((p) => p.imagens.map((i) => i.id))) + 1
  return imagens.map((img) => ({
    id: nextId++,
    produtoId,
    url: img.url,
    altText: img.altText ?? null,
    ordem: img.ordem,
  }))
}

/** Envia o arquivo (BLOB no backend) e devolve a referência para `imagens[].url`. */
export async function uploadImagem(file: File): Promise<{ id: number; url: string }> {
  if (!USE_MOCK) {
    const form = new FormData()
    form.append('arquivo', file)
    // Header explícito: o client usa JSON por padrão e o axios serializaria o FormData como JSON.
    const { data } = await apiClient.post<{ id: number; url: string }>('/admin/produtos/imagens', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }
  await delay()
  return { id: Date.now(), url: URL.createObjectURL(file) }
}

export async function createProduto(body: ProdutoInput): Promise<Produto> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<Produto>('/admin/produtos', body)
    return data
  }
  await delay()
  const now = new Date().toISOString()
  const id = Math.max(0, ...mockProdutos.map((p) => p.id)) + 1
  const produto: Produto = {
    id,
    nome: body.nome,
    slug: body.slug,
    descricao: body.descricao ?? null,
    fichaTecnica: body.fichaTecnica ?? null,
    preco: body.preco,
    categoriaId: body.categoriaId,
    ativo: body.ativo,
    imagens: mapImagens(id, body.imagens),
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
  const { imagens, ...rest } = body
  Object.assign(produto, rest, { updatedAt: new Date().toISOString() })
  if (imagens !== undefined) {
    produto.imagens = mapImagens(id, imagens)
  }
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

/** Remove o ajuste próprio da categoria: ela volta a usar os valores gerais. */
export async function removerDecayCategoria(categoriaId: number): Promise<ParametroDecay[]> {
  if (!USE_MOCK) {
    const { data } = await apiClient.delete<ParametroDecay[]>(`/admin/configuracao/decay/${categoriaId}`)
    return data
  }
  await delay()
  const i = mockDecay.findIndex((d) => d.categoriaId === categoriaId)
  if (i >= 0) mockDecay.splice(i, 1)
  return structuredClone(mockDecay)
}

/** Simula parâmetros propostos com os dados reais, sem gravar (impacto + precisão em backtest). */
export async function simularScoring(params: {
  pesos: PesoMetrica[]
  decay: ParametroDecay[]
}): Promise<SimulacaoResponse> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<SimulacaoResponse>('/admin/configuracao/simular', {
      pesos: params.pesos,
      decay: params.decay.map(({ categoriaId, lambda, boostConversao }) => ({
        categoriaId,
        lambda,
        boostConversao,
      })),
    })
    // Campos de categoria podem faltar (backend de versão anterior): vazios em vez de quebrar a prévia.
    const i = data.impacto
    return {
      ...data,
      impacto: {
        ...i,
        mudamDeCategoria: i.mudamDeCategoria ?? 0,
        categoriasAtual: i.categoriasAtual ?? [],
        categoriasProposta: i.categoriasProposta ?? [],
        mudancasCategoria: i.mudancasCategoria ?? [],
      },
    }
  }
  await delay()
  const atual = mockDashboard.series.distribuicaoScores.map((d) => ({
    nivel: d.faixa as SimulacaoResponse['impacto']['atual'][number]['nivel'],
    quantidade: d.quantidade,
  }))
  return {
    impacto: {
      clientesAnalisados: atual.reduce((a, d) => a + d.quantidade, 0),
      atual,
      proposta: atual,
      notaMediaAtual: 52,
      notaMediaProposta: 52,
      mudamDeNivel: 0,
      mudancas: [],
      mudamDeCategoria: 0,
      categoriasAtual: [],
      categoriasProposta: [],
      mudancasCategoria: [],
    },
    precisao: { corte: null, amostras: 0, conversoes: 0, confianca: 'BAIXA', atual: null, proposta: null },
  }
}

/** Recalcula e grava as notas de todos os clientes e visitantes com os parâmetros salvos. */
export async function recalcularScores(): Promise<{ recalculados: number }> {
  if (!USE_MOCK) {
    const { data } = await apiClient.post<{ recalculados: number }>('/admin/configuracao/recalcular')
    return data
  }
  await delay()
  return { recalculados: 0 }
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
