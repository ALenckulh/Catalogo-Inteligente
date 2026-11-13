import { palette } from '@/lib/theme/tokens'

/**
 * Nível de interesse do cliente, derivado do maior score de produto (0–100).
 * Espelha `com.catalogo.admin.domain.NivelInteresse` no backend (mesmos cortes).
 * `cor` segue o significado (fogo = vermelho, brasa = âmbar, frio = azul, sem interação = cinza),
 * com contraste ≥ 3:1 sobre branco; é usada no gráfico do dashboard e nos ícones da lista.
 */
export const NIVEIS_INTERESSE = {
  QUENTE: {
    nome: 'Quente',
    label: 'Quente (70–100)',
    tooltipTitle: 'Quente (nota 70 a 100) · muito interesse',
    descricao: 'Bom momento para contato',
    cor: palette.error[500],
  },
  MORNO: {
    nome: 'Morno',
    label: 'Morno (40–69)',
    tooltipTitle: 'Morno (nota 40 a 69) · algum interesse',
    descricao: 'Vale acompanhar',
    cor: palette.warning[600],
  },
  FRIO: {
    nome: 'Frio',
    label: 'Frio (0–39)',
    tooltipTitle: 'Frio (nota 0 a 39) · pouco interesse',
    descricao: 'Olharam pouco até agora',
    cor: palette.primary[400],
  },
  SEM_SCORE: {
    nome: 'Sem interação',
    label: 'Sem interação',
    tooltipTitle: 'Sem interação · ainda sem nota',
    descricao: 'Ainda não navegaram',
    cor: palette.neutral[600],
  },
} as const

export type NivelInteresse = keyof typeof NIVEIS_INTERESSE

export const NIVEL_ALTO = 70
export const NIVEL_MORNO_MIN = 40

export function isNivelInteresse(v: unknown): v is NivelInteresse {
  return typeof v === 'string' && v in NIVEIS_INTERESSE
}

export function nivelDoScore(score: number | null | undefined): NivelInteresse {
  if (score == null) return 'SEM_SCORE'
  if (score >= NIVEL_ALTO) return 'QUENTE'
  if (score >= NIVEL_MORNO_MIN) return 'MORNO'
  return 'FRIO'
}
