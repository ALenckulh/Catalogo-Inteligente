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

export interface ProdutoInput {
  nome: string
  slug: string
  descricao?: string
  preco: number
  categoriaId: number
  ativo: boolean
  fichaTecnica?: Record<string, string>
}
