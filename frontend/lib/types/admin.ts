import type { TipoEvento } from './index'

export interface Compra {
  id: number
  usuarioId: number
  produtoId: number
  produtoNome?: string
  precoUnitario: number
  quantidade: number
  valorTotal: number
  data: string
  observacoes: string | null
}

export type CompraInput = Omit<Compra, 'id' | 'usuarioId' | 'produtoNome'>

export interface ScoreProdutoRow {
  produtoId: number
  produtoNome: string
  valor: number
}

export interface ScoreCategoriaRow {
  categoriaId: number
  categoriaNome: string
  valor: number
}

export interface FaixaPrecoUsuario {
  medianaComConversao: number
  medianaSemConversao: number
  gapPreco: number
}

export type AdminUsuarioListItem = import('./index').Usuario & {
  scoreMaxProduto: number | null
  topCategoria: string | null
  ultimaAtividade: string | null
  /** Conta não soft-deleted (`deleted_at` nulo). */
  ativo: boolean
}

export interface AdminUsuarioDetalhe {
  usuario: import('./index').Usuario
  scoresProduto: ScoreProdutoRow[]
  scoresCategoria: ScoreCategoriaRow[]
  faixaPreco: FaixaPrecoUsuario
  compras: Compra[]
}

export interface PesoMetrica {
  tipoEvento: TipoEvento
  peso: number
}

export interface ParametroDecay {
  categoriaId: number | null
  categoriaNome: string | null
  lambda: number
  boostConversao: number
}

/** Nível de interesse (espelha `NivelInteresse` do backend). */
export type NivelInteresseApi = 'QUENTE' | 'MORNO' | 'FRIO' | 'SEM_SCORE'

export interface SimulacaoMudancaCliente {
  usuarioId: number
  nome: string
  nivelAtual: NivelInteresseApi
  nivelProposto: NivelInteresseApi
  notaAtual: number | null
  notaProposta: number | null
}

/** Quantos clientes têm a categoria como favorita (maior nota de categoria). */
export interface SimulacaoCategoriaContagem {
  categoriaId: number
  nome: string
  quantidade: number
}

/** Categoria favorita do cliente hoje e com os ajustes; null = nenhuma. */
export interface SimulacaoMudancaCategoria {
  usuarioId: number
  nome: string
  categoriaAtual: string | null
  categoriaProposta: string | null
}

export interface SimulacaoImpacto {
  clientesAnalisados: number
  atual: { nivel: NivelInteresseApi; quantidade: number }[]
  proposta: { nivel: NivelInteresseApi; quantidade: number }[]
  notaMediaAtual: number | null
  notaMediaProposta: number | null
  mudamDeNivel: number
  mudancas: SimulacaoMudancaCliente[]
  mudamDeCategoria: number
  /** Mesmas categorias, na mesma ordem, nos dois cenários. */
  categoriasAtual: SimulacaoCategoriaContagem[]
  categoriasProposta: SimulacaoCategoriaContagem[]
  mudancasCategoria: SimulacaoMudancaCategoria[]
}

/** Frações 0–1; null = indefinido (ex.: nenhum Quente no período). */
export interface SimulacaoMetricas {
  precisaoQuentes: number | null
  recallQuentes: number | null
  auc: number | null
  acertoTop3: number | null
  quentes: number
}

export interface SimulacaoPrecisao {
  /** null = histórico insuficiente para o backtest. */
  corte: string | null
  amostras: number
  conversoes: number
  confianca: 'BAIXA' | 'MEDIA' | 'ALTA'
  atual: SimulacaoMetricas | null
  proposta: SimulacaoMetricas | null
}

export interface SimulacaoResponse {
  impacto: SimulacaoImpacto
  precisao: SimulacaoPrecisao
}

export interface ProdutoInput {
  nome: string
  slug: string
  descricao?: string
  preco: number
  categoriaId: number
  ativo: boolean
  fichaTecnica?: Record<string, string>
  imagens?: Array<{ url: string; altText?: string | null; ordem: number }>
}
