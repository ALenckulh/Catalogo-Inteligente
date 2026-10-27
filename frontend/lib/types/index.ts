export type TipoUsuario = 'PF' | 'PJ' | 'ADMIN'

export type TipoEvento =
  | 'VISUALIZACAO_PRODUTO'
  | 'FAVORITAR'
  | 'DESFAVORITAR'
  | 'CONTATO_WHATSAPP'
  | 'PESQUISA'
  | 'FILTRO_APLICADO'
  | 'SCROLL_DEPTH'
  | 'TEMPO_PAGINA'

export type TipoConversao = 'LEVE' | 'FORTE' | 'CONFIRMADA'

export type TipoConsentimento =
  | 'TERMOS_USO'
  | 'POLITICA_PRIVACIDADE'
  | 'COOKIES_COMPORTAMENTAIS'
  | 'CONTATO_PROATIVO'

export type CookieConsentLevel = 'all' | 'essential' | 'custom'

export interface Usuario {
  id: number
  tipo: TipoUsuario
  email: string
  telefone: string | null
  emailAlternativo: string | null
  cpf: string | null
  nomeCompleto: string | null
  idade: number | null
  cnpj: string | null
  razaoSocial: string | null
  createdAt: string
  updatedAt: string
}

export interface Categoria {
  id: number
  nome: string
  slug: string
  parentId: number | null
  descricao: string | null
}

export interface ProdutoImagem {
  id: number
  produtoId: number
  url: string
  ordem: number
  altText: string | null
}

export interface Produto {
  id: number
  nome: string
  slug: string
  descricao: string | null
  fichaTecnica: Record<string, string> | null
  preco: number
  categoriaId: number
  categoria?: Categoria
  ativo: boolean
  imagens: ProdutoImagem[]
  createdAt: string
  updatedAt: string
}

export interface Favorito {
  usuarioId: number
  produtoId: number
  produto?: Produto
  createdAt: string
}

export interface ConsentimentoLgpd {
  tipo: TipoConsentimento
  aceito: boolean
  versaoTermos: string
  aceitoEm: string
}

export interface AuthSession {
  token: string
  usuario: Usuario
}

export interface LoginRequest {
  email: string
  senha: string
}

export interface SignupRequest {
  tipo: 'PF' | 'PJ'
  email: string
  senha: string
  telefone?: string
  emailAlternativo?: string
  cpf?: string
  nomeCompleto?: string
  idade?: number
  cnpj?: string
  razaoSocial?: string
  aceitaTermos: boolean
  aceitaPrivacidade: boolean
  cookiesComportamentais?: boolean
  contatoProativo?: boolean
}

export interface ProdutosQuery {
  q?: string
  categoria?: number
  precoMin?: number
  precoMax?: number
  page?: number
  limit?: number
  destaque?: boolean
}

export interface Page<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

export interface EventoPayload {
  tipo: TipoEvento
  produtoId?: number
  conversao?: TipoConversao
  metadados?: Record<string, string | number | boolean | object>
}

export interface DashboardKpis {
  usuariosAtivos: number
  produtosAtivos: number
  contatos7d: number
  leadsScoreAlto: number
}

export interface LeadResumo {
  usuarioId: number
  nome: string
  tipo: TipoUsuario
  email: string
  telefone: string | null
  scoreMaxProduto: number
  topCategoria: string | null
  ultimaAtividade: string
}

export interface DashboardSeries {
  distribuicaoScores: { faixa: string; quantidade: number }[]
  contatosPorDia: { data: string; quantidade: number }[]
  leadsPorCategoria: { categoria: string; quantidade: number }[]
}

export interface AdminDashboard {
  kpis: DashboardKpis
  leads: LeadResumo[]
  series: DashboardSeries
}

export interface ApiErrorBody {
  code: string
  message: string
}

export type {
  Compra,
  ScoreProdutoRow,
  ScoreCategoriaRow,
  FaixaPrecoUsuario,
  AdminUsuarioListItem,
  AdminUsuarioDetalhe,
  PesoMetrica,
  ParametroDecay,
  ProdutoInput,
} from './admin'
