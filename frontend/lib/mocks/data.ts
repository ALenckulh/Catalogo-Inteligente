import type {
  AdminDashboard,
  Categoria,
  Compra,
  Favorito,
  ParametroDecay,
  PesoMetrica,
  Produto,
  Usuario,
} from '@/lib/types'

const now = '2026-03-15T12:00:00.000Z'

export const mockCategorias: Categoria[] = [
  {
    id: 1,
    nome: 'Tecidos',
    slug: 'tecidos',
    parentId: null,
    descricao: 'Tecidos planos e malhas',
  },
  {
    id: 2,
    nome: 'Aviamentos',
    slug: 'aviamentos',
    parentId: null,
    descricao: 'Botões, zíperes e acabamentos',
  },
  {
    id: 3,
    nome: 'Malhas',
    slug: 'malhas',
    parentId: 1,
    descricao: 'Malhas de algodão e blends',
  },
]

export const mockProdutos: Produto[] = [
  {
    id: 1,
    nome: 'Malha PV Premium',
    slug: 'malha-pv-premium',
    descricao: 'Malha PV 50/50 com toque macio, ideal para camisetas corporativas.',
    fichaTecnica: {
      composicao: '50% poliéster / 50% viscose',
      gramatura: '160 g/m²',
      largura: '1,80 m',
    },
    preco: 28.9,
    categoriaId: 3,
    ativo: true,
    imagens: [
      {
        id: 1,
        produtoId: 1,
        url: 'https://placehold.co/600x600/e8e8e8/666?text=Malha+PV',
        ordem: 0,
        altText: 'Rolo de malha PV premium',
      },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    nome: 'Tecido Oxford Colorido',
    slug: 'tecido-oxford-colorido',
    descricao: 'Oxford 100% poliéster para uniformes e moda casual.',
    fichaTecnica: {
      composicao: '100% poliéster',
      gramatura: '140 g/m²',
      largura: '1,50 m',
    },
    preco: 19.5,
    categoriaId: 1,
    ativo: true,
    imagens: [
      {
        id: 2,
        produtoId: 2,
        url: 'https://placehold.co/600x600/e8e8e8/666?text=Oxford',
        ordem: 0,
        altText: 'Tecido oxford colorido',
      },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    nome: 'Zíper YKK 20cm',
    slug: 'ziper-ykk-20cm',
    descricao: 'Zíper metálico YKK, comprimento 20 cm, várias cores.',
    fichaTecnica: {
      material: 'Metal / poliéster',
      comprimento: '20 cm',
    },
    preco: 4.75,
    categoriaId: 2,
    ativo: true,
    imagens: [
      {
        id: 3,
        produtoId: 3,
        url: 'https://placehold.co/600x600/e8e8e8/666?text=Ziper',
        ordem: 0,
        altText: 'Zíper YKK 20cm',
      },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 4,
    nome: 'Botão Resina 18L',
    slug: 'botao-resina-18l',
    descricao: 'Botão de resina 18 linhas, acabamento fosco.',
    fichaTecnica: {
      material: 'Resina',
      tamanho: '18L',
    },
    preco: 0.35,
    categoriaId: 2,
    ativo: true,
    imagens: [
      {
        id: 4,
        produtoId: 4,
        url: 'https://placehold.co/600x600/e8e8e8/666?text=Botao',
        ordem: 0,
        altText: 'Botão de resina 18L',
      },
    ],
    createdAt: now,
    updatedAt: now,
  },
]

export const mockUsuarios: Usuario[] = [
  {
    id: 1,
    tipo: 'PF',
    email: 'maria@exemplo.com',
    telefone: '47999990001',
    emailAlternativo: null,
    cpf: '52998224725',
    nomeCompleto: 'Maria Silva',
    idade: 34,
    cnpj: null,
    razaoSocial: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    tipo: 'PJ',
    email: 'contato@confeccoesexemplo.com',
    telefone: '47988880002',
    emailAlternativo: 'compras@confeccoesexemplo.com',
    cpf: null,
    nomeCompleto: null,
    idade: null,
    cnpj: '11222333000181',
    razaoSocial: 'Confecções Exemplo LTDA',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    tipo: 'ADMIN',
    email: 'admin@catalogo.com',
    telefone: '47977770003',
    emailAlternativo: null,
    cpf: null,
    nomeCompleto: 'Admin Catálogo',
    idade: null,
    cnpj: null,
    razaoSocial: null,
    createdAt: now,
    updatedAt: now,
  },
]

/** senha mock para todos: "senha123" */
export const MOCK_PASSWORD = 'senha123'

export let mockFavoritos: Favorito[] = [
  {
    usuarioId: 1,
    produtoId: 1,
    createdAt: now,
  },
  {
    usuarioId: 1,
    produtoId: 3,
    createdAt: now,
  },
]

export function resetFavoritos(): void {
  mockFavoritos = [
    { usuarioId: 1, produtoId: 1, createdAt: now },
    { usuarioId: 1, produtoId: 3, createdAt: now },
  ]
}

export const mockDashboard: AdminDashboard = {
  kpis: {
    usuariosAtivos: 42,
    produtosAtivos: mockProdutos.filter((p) => p.ativo).length,
    contatos7d: 11,
    leadsScoreAlto: 5,
  },
  leads: [
    {
      usuarioId: 1,
      nome: 'Maria Silva',
      tipo: 'PF',
      email: 'maria@exemplo.com',
      telefone: '47999990001',
      scoreMaxProduto: 87.5,
      topCategoria: 'Malhas',
      ultimaAtividade: '2026-03-20T10:30:00.000Z',
    },
    {
      usuarioId: 2,
      nome: 'Confecções Exemplo LTDA',
      tipo: 'PJ',
      email: 'contato@confeccoesexemplo.com',
      telefone: '47988880002',
      scoreMaxProduto: 72.0,
      topCategoria: 'Aviamentos',
      ultimaAtividade: '2026-03-19T16:00:00.000Z',
    },
  ],
  series: {
    distribuicaoScores: [
      { faixa: '0–20', quantidade: 8 },
      { faixa: '21–40', quantidade: 12 },
      { faixa: '41–60', quantidade: 15 },
      { faixa: '61–80', quantidade: 9 },
      { faixa: '81–100', quantidade: 5 },
    ],
    contatosPorDia: [
      { data: '2026-03-07', quantidade: 1 },
      { data: '2026-03-08', quantidade: 0 },
      { data: '2026-03-09', quantidade: 2 },
      { data: '2026-03-10', quantidade: 1 },
      { data: '2026-03-11', quantidade: 3 },
      { data: '2026-03-12', quantidade: 2 },
      { data: '2026-03-13', quantidade: 1 },
      { data: '2026-03-14', quantidade: 0 },
      { data: '2026-03-15', quantidade: 2 },
      { data: '2026-03-16', quantidade: 1 },
      { data: '2026-03-17', quantidade: 3 },
      { data: '2026-03-18', quantidade: 2 },
      { data: '2026-03-19', quantidade: 1 },
      { data: '2026-03-20', quantidade: 2 },
    ],
    leadsPorCategoria: [
      { categoria: 'Malhas', quantidade: 18 },
      { categoria: 'Aviamentos', quantidade: 12 },
      { categoria: 'Tecidos', quantidade: 9 },
      { categoria: 'Linhas', quantidade: 5 },
    ],
  },
}

export function withCategoria(produto: Produto): Produto {
  const categoria = mockCategorias.find((c) => c.id === produto.categoriaId)
  return { ...produto, categoria }
}

export const mockCompras: Compra[] = [
  {
    id: 1,
    usuarioId: 1,
    produtoId: 1,
    produtoNome: 'Malha PV Premium',
    precoUnitario: 28.9,
    quantidade: 50,
    valorTotal: 1445,
    data: '2026-02-10',
    observacoes: null,
  },
  {
    id: 2,
    usuarioId: 1,
    produtoId: 3,
    produtoNome: 'Zíper YKK 20cm',
    precoUnitario: 4.75,
    quantidade: 200,
    valorTotal: 950,
    data: '2026-02-10',
    observacoes: 'Mesmo pedido',
  },
]

export const mockPesos: PesoMetrica[] = [
  { tipoEvento: 'VISUALIZACAO_PRODUTO', peso: 1 },
  { tipoEvento: 'FAVORITAR', peso: 3 },
  { tipoEvento: 'DESFAVORITAR', peso: -1 },
  { tipoEvento: 'CONTATO_WHATSAPP', peso: 5 },
  { tipoEvento: 'PESQUISA', peso: 1.5 },
  { tipoEvento: 'FILTRO_APLICADO', peso: 1 },
  { tipoEvento: 'SCROLL_DEPTH', peso: 0.5 },
  { tipoEvento: 'TEMPO_PAGINA', peso: 0.8 },
]

export const mockDecay: ParametroDecay[] = [
  { categoriaId: null, categoriaNome: null, lambda: 0.05, boostConversao: 1.2 },
  { categoriaId: 1, categoriaNome: 'Tecidos', lambda: 0.04, boostConversao: 1.15 },
  { categoriaId: 2, categoriaNome: 'Aviamentos', lambda: 0.06, boostConversao: 1.1 },
]
