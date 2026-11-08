import { palette } from '@/lib/theme/tokens'
import type { ParametroDecay, PesoMetrica, TipoEvento } from '@/lib/types'

/**
 * Textos e contas da tela de configuração de scoring.
 * As funções espelham o backend (`ScoringParams`, `ScoreCalculator`, `DecayCalculator`).
 */

interface EventoScoring {
  nome: string
  descricao: string
  /** Cor da fatia na barra de composição da nota. */
  cor: string
  /** Soma na nota da categoria (não na de produto) e fica fora do divisor da nota de produto. */
  alvo?: 'categoria'
  /** Subtrai pontos (o motor usa valor −1). */
  penalidade?: boolean
  /** Vale proporcionalmente (rolagem / tempo): os pontos mostrados são o máximo. */
  proporcional?: string
}

export const EVENTOS_SCORING: Record<TipoEvento, EventoScoring> = {
  CONTATO_WHATSAPP: {
    nome: 'Chamar no WhatsApp',
    descricao: 'O cliente clicou em “Falar no WhatsApp” na página do produto. É o sinal mais forte de intenção de compra.',
    cor: palette.primary[600],
  },
  FAVORITAR: {
    nome: 'Favoritar',
    descricao: 'O cliente marcou o produto como favorito.',
    cor: palette.secondary[400],
  },
  VISUALIZACAO_PRODUTO: {
    nome: 'Ver um produto',
    descricao: 'O cliente abriu a página do produto. Cada visita soma.',
    cor: palette.primary[300],
  },
  TEMPO_PAGINA: {
    nome: 'Tempo na página',
    descricao: 'Quanto tempo o cliente ficou na página do produto. Vale o máximo com 2 minutos ou mais; menos tempo vale proporcionalmente menos.',
    cor: palette.warning[400],
    proporcional: 'com 2 min ou mais',
  },
  SCROLL_DEPTH: {
    nome: 'Rolar a página',
    descricao: 'Quanto da página do produto o cliente rolou. Vale o máximo ao chegar no fim; menos rolagem vale proporcionalmente menos.',
    cor: palette.secondary[200],
    proporcional: 'rolando até o fim',
  },
  DESFAVORITAR: {
    nome: 'Remover dos favoritos',
    descricao: 'O cliente tirou o produto dos favoritos. Diminui a nota daquele produto.',
    cor: palette.neutral[500],
    penalidade: true,
  },
  PESQUISA: {
    nome: 'Pesquisar e abrir',
    descricao: 'O cliente pesquisou no catálogo e abriu um produto do resultado. Indica interesse forte naquele produto. Pesquisas sem abrir nenhum produto não contam.',
    cor: palette.error[300],
  },
  FILTRO_APLICADO: {
    nome: 'Filtrar por categoria',
    descricao: 'O cliente filtrou o catálogo por uma categoria. Soma na nota de interesse daquela categoria (usada em “Categoria favorita”), não na nota de produto.',
    cor: palette.neutral[500],
    alvo: 'categoria',
  },
}

/** Ordem de exibição: do sinal mais forte ao mais fraco; o de categoria por último. */
export const ORDEM_EVENTOS: TipoEvento[] = [
  'CONTATO_WHATSAPP',
  'PESQUISA',
  'FAVORITAR',
  'VISUALIZACAO_PRODUTO',
  'TEMPO_PAGINA',
  'SCROLL_DEPTH',
  'DESFAVORITAR',
  'FILTRO_APLICADO',
]

/** Valores iniciais do sistema (database/migrations/V010__seed_config.sql). */
export const PESOS_PADRAO: PesoMetrica[] = [
  { tipoEvento: 'VISUALIZACAO_PRODUTO', peso: 0.2 },
  { tipoEvento: 'FAVORITAR', peso: 0.5 },
  { tipoEvento: 'DESFAVORITAR', peso: 0.1 },
  { tipoEvento: 'CONTATO_WHATSAPP', peso: 1 },
  { tipoEvento: 'PESQUISA', peso: 0.5 },
  { tipoEvento: 'FILTRO_APLICADO', peso: 0.5 },
  { tipoEvento: 'SCROLL_DEPTH', peso: 0.3 },
  { tipoEvento: 'TEMPO_PAGINA', peso: 0.5 },
]
export const LAMBDA_PADRAO = 0.01
export const BOOST_PADRAO = 1

/** Divisor da nota: soma dos pesos positivos das métricas de produto (sem as de categoria). */
export function scoreMax(pesos: PesoMetrica[]): number {
  const soma = pesos
    .filter((p) => EVENTOS_SCORING[p.tipoEvento]?.alvo !== 'categoria' && p.peso > 0)
    .reduce((acc, p) => acc + p.peso, 0)
  return soma > 0 ? soma : 1
}

/**
 * Pontos (0–100) que uma única ocorrência de cada evento soma, sem decaimento: na nota do produto
 * ou, para eventos de categoria, na nota da categoria (mesma escala).
 */
export function pontosPorAcao(pesos: PesoMetrica[]): Partial<Record<TipoEvento, number>> {
  const max = scoreMax(pesos)
  const out: Partial<Record<TipoEvento, number>> = {}
  for (const p of pesos) {
    out[p.tipoEvento] = (p.peso / max) * 100
  }
  return out
}

export function meiaVidaDeLambda(lambda: number): number {
  return lambda > 0 ? Math.LN2 / lambda : Infinity
}

/**
 * λ arredondado em 5 casas, a precisão da coluna (NUMERIC(6,5)). Com 5 casas toda meia-vida
 * inteira de 7 a 180 dias volta exatamente ao mesmo número de dias (com 4 casas, não).
 */
export function lambdaDeMeiaVida(dias: number): number {
  return Math.round((Math.LN2 / Math.max(1, dias)) * 100000) / 100000
}

/**
 * Quanto uma ação ainda vale (0–1) depois de `dias`, como no `DecayCalculator`
 * (sem considerar a pausa de 60 dias após contato).
 */
export function fatorDecaimento(dias: number, lambda: number, comConversao: boolean): number {
  if (dias < 7) return 1
  if (dias <= 90) return Math.exp(-lambda * dias)
  if (dias <= 180) return Math.exp(-lambda * dias * (comConversao ? 1 : 2))
  return comConversao ? Math.exp(-lambda * dias) : 0
}

export function decayGlobal(decay: ParametroDecay[]): ParametroDecay {
  return (
    decay.find((d) => d.categoriaId == null) ?? {
      categoriaId: null,
      categoriaNome: null,
      lambda: LAMBDA_PADRAO,
      boostConversao: BOOST_PADRAO,
    }
  )
}

export function formatPontos(p: number): string {
  const v = Math.round(p)
  return v === 0 && p > 0 ? '<1' : String(v)
}
