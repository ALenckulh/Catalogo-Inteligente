import { palette } from '@/lib/theme/tokens'
import type { ParametroDecay, PesoMetrica, TipoMetrica } from '@/lib/types'

/**
 * Textos e contas da tela de configuração de scoring.
 * As funções espelham o backend (`ScoringParams`, `ScoreCalculator`, `DecayCalculator`).
 */

interface EventoScoring {
  nome: string
  /** Uma frase: o que o cliente fez. */
  resumo: string
  /** Como a ação conta; vem depois do resumo. */
  detalhe?: string
  /** Cor da fatia na barra de composição da nota. */
  cor: string
  /** Soma na nota da categoria (não na de produto) e fica fora do divisor da nota de produto. */
  alvo?: 'categoria'
  /** Soma na nota de produto sem diluir as outras métricas (compra e retorno). */
  foraDoDivisor?: boolean
  /** Subtrai pontos (o motor usa valor −1). */
  penalidade?: boolean
  /** Vale proporcionalmente (rolagem / tempo): os pontos mostrados são o máximo. */
  proporcional?: string
}

export const EVENTOS_SCORING: Record<TipoMetrica, EventoScoring> = {
  CONTATO_WHATSAPP: {
    nome: 'Chamar no WhatsApp',
    resumo: 'O cliente clicou em “Entrar em contato” na página do produto.',
    detalhe: 'É o sinal mais forte de intenção de compra.',
    cor: palette.primary[600],
  },
  COMPRA: {
    nome: 'Comprar',
    resumo: 'Compra que você registrou para o cliente.',
    detalhe: 'Soma a partir de 3 compras, sem esfriar, e vale metade depois de 2 anos. Não muda o peso das outras ações.',
    cor: palette.success[500],
    foraDoDivisor: true,
  },
  FAVORITAR: {
    nome: 'Favoritar',
    resumo: 'O cliente marcou o produto como favorito.',
    cor: palette.secondary[400],
  },
  VISUALIZACAO_PRODUTO: {
    nome: 'Ver um produto',
    resumo: 'O cliente abriu a página do produto.',
    detalhe: 'Cada visita soma.',
    cor: palette.primary[300],
  },
  RETORNO_PAGINA: {
    nome: 'Voltar ao produto',
    resumo: 'O cliente viu o mesmo produto em outra visita.',
    detalhe: 'Soma uma vez por visita depois da primeira, além de “Ver um produto”. Não muda o peso das outras ações.',
    cor: palette.secondary[600],
    foraDoDivisor: true,
  },
  TEMPO_PAGINA: {
    nome: 'Tempo na página',
    resumo: 'Quanto tempo o cliente ficou na página do produto.',
    detalhe: 'Vale o máximo com 2 minutos ou mais; menos tempo vale proporcionalmente menos.',
    cor: palette.warning[400],
    proporcional: 'com 2 min ou mais',
  },
  SCROLL_DEPTH: {
    nome: 'Rolar a página',
    resumo: 'Quanto da página do produto o cliente rolou.',
    detalhe: 'Vale o máximo ao chegar no fim; menos rolagem vale proporcionalmente menos.',
    cor: palette.secondary[200],
    proporcional: 'rolando até o fim',
  },
  DESFAVORITAR: {
    nome: 'Remover dos favoritos',
    resumo: 'O cliente tirou o produto dos favoritos.',
    detalhe: 'Diminui a nota daquele produto.',
    cor: palette.neutral[500],
    penalidade: true,
  },
  PESQUISA: {
    nome: 'Pesquisar e abrir',
    resumo: 'O cliente pesquisou no catálogo e abriu um produto do resultado.',
    detalhe: 'Indica interesse forte naquele produto. Pesquisas sem abrir nenhum produto não contam.',
    cor: palette.error[300],
  },
  FILTRO_APLICADO: {
    nome: 'Filtrar por categoria',
    resumo: 'O cliente filtrou o catálogo por uma categoria.',
    detalhe: 'Soma na nota de interesse daquela categoria (usada em “Categoria favorita”), não na nota de produto.',
    cor: palette.neutral[500],
    alvo: 'categoria',
  },
}

/** Resumo e detalhe juntos, para quando só há lugar para um texto. */
export function descricaoCompleta(tipo: TipoMetrica): string {
  const { resumo, detalhe } = EVENTOS_SCORING[tipo]
  return detalhe ? `${resumo} ${detalhe}` : resumo
}

/** Ordem de exibição: do sinal mais forte ao mais fraco; o de categoria por último. */
export const ORDEM_EVENTOS: TipoMetrica[] = [
  'CONTATO_WHATSAPP',
  'COMPRA',
  'PESQUISA',
  'FAVORITAR',
  'VISUALIZACAO_PRODUTO',
  'RETORNO_PAGINA',
  'TEMPO_PAGINA',
  'SCROLL_DEPTH',
  'DESFAVORITAR',
  'FILTRO_APLICADO',
]

/** Valores iniciais do sistema (database/migrations/V010, V020 e V023). */
export const PESOS_PADRAO: PesoMetrica[] = [
  { tipoEvento: 'VISUALIZACAO_PRODUTO', peso: 0.1 },
  { tipoEvento: 'FAVORITAR', peso: 1.2 },
  { tipoEvento: 'DESFAVORITAR', peso: 0.1 },
  { tipoEvento: 'CONTATO_WHATSAPP', peso: 1.5 },
  { tipoEvento: 'PESQUISA', peso: 0.4 },
  { tipoEvento: 'FILTRO_APLICADO', peso: 0.5 },
  { tipoEvento: 'SCROLL_DEPTH', peso: 0.3 },
  { tipoEvento: 'TEMPO_PAGINA', peso: 0.2 },
  { tipoEvento: 'COMPRA', peso: 1 },
  { tipoEvento: 'RETORNO_PAGINA', peso: 0 },
]
/** Meia-vida de 90 dias. */
export const LAMBDA_PADRAO = 0.0077
export const BOOST_PADRAO = 1
export const PAUSA_PADRAO = 60

function entraNoDivisor(tipo: TipoMetrica): boolean {
  const e = EVENTOS_SCORING[tipo]
  return e?.alvo !== 'categoria' && !e?.foraDoDivisor
}

/** Divisor da nota: soma dos pesos positivos das métricas de produto (sem as de categoria, compra e retorno). */
export function scoreMax(pesos: PesoMetrica[]): number {
  const soma = pesos
    .filter((p) => entraNoDivisor(p.tipoEvento) && p.peso > 0)
    .reduce((acc, p) => acc + p.peso, 0)
  return soma > 0 ? soma : 1
}

/**
 * Pontos (0–100) que uma única ocorrência de cada evento soma, sem decaimento: na nota do produto
 * ou, para eventos de categoria, na nota da categoria (mesma escala).
 */
export function pontosPorAcao(pesos: PesoMetrica[]): Partial<Record<TipoMetrica, number>> {
  const max = scoreMax(pesos)
  const out: Partial<Record<TipoMetrica, number>> = {}
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
 * (sem considerar a pausa após contato ou compra).
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
      boostRecorrencia: BOOST_PADRAO,
      pausaDias: PAUSA_PADRAO,
    }
  )
}

export function formatPontos(p: number): string {
  const v = Math.round(p)
  return v === 0 && p > 0 ? '<1' : String(v)
}
