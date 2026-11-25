import { delay } from '@/lib/mocks/delay'
import { apiClient, toApiError } from './client'
import { SESSAO_ATIVA_EM_KEY, SESSAO_ID_KEY, USE_MOCK } from './config'
import { persistVisitanteId, readVisitanteId } from './visitanteId'

/** Sem evento por 30 min, a próxima interação é outra visita (janela usual de analytics). */
export const SESSAO_INATIVIDADE_MS = 30 * 60 * 1000

export interface SessaoVisitante {
  /** null quando a sessão é de usuário logado (sem visitante). */
  cookieId: string | null
  sessaoId: number
}

/** Classe do aparelho pelo user agent. O iPad se apresenta como Mac, mas tem toque. */
export function dispositivo(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent
  const ipad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  if (ipad || /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet'
  return /Mobi|iPhone|Android/i.test(ua) ? 'mobile' : 'desktop'
}

function persistSessao(sessao: SessaoVisitante): void {
  if (typeof window === 'undefined') return
  if (sessao.cookieId) persistVisitanteId(sessao.cookieId)
  try {
    window.localStorage.setItem(SESSAO_ID_KEY, String(sessao.sessaoId))
  } catch {
    /* ignore */
  }
  marcarAtividade()
}

function marcarAtividade(): void {
  try {
    window.localStorage.setItem(SESSAO_ATIVA_EM_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

/** Sessão desta visita, se o último evento foi há menos de 30 min. */
function readSessaoAtiva(): number | undefined {
  const id = readSessaoId()
  if (id === undefined) return undefined
  try {
    const ativaEm = Number(window.localStorage.getItem(SESSAO_ATIVA_EM_KEY) ?? NaN)
    return Date.now() - ativaEm < SESSAO_INATIVIDADE_MS ? id : undefined
  } catch {
    return undefined
  }
}

async function postSessao(cookieId?: string | null): Promise<SessaoVisitante> {
  const { data } = await apiClient.post<SessaoVisitante>(
    '/visitantes/sessao',
    {
      cookieId: cookieId || undefined,
      dispositivo: typeof navigator !== 'undefined' ? dispositivo() : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      canalOrigem: 'web',
    },
  )
  return data
}

/**
 * Abre uma sessão nova (cada chamada insere uma linha no backend). Para enviar evento, use `garantirSessao`.
 * Com token, a sessão é do usuário e o visitante não muda.
 * Anônimo: o backend só aceita cookieId já persistido; em 400, cria outro visitante. Nos demais erros
 * (rede, 429, 500) o visitante é mantido, para não perder a identidade dele por uma falha passageira.
 */
export async function abrirSessaoVisitante(
  cookieId?: string | null,
): Promise<SessaoVisitante> {
  if (!USE_MOCK) {
    const existing = cookieId ?? readVisitanteId()
    try {
      const sessao = await postSessao(existing)
      persistSessao(sessao)
      return sessao
    } catch (e) {
      if (existing && toApiError(e).status === 400) {
        const sessao = await postSessao(null)
        persistSessao(sessao)
        return sessao
      }
      throw e
    }
  }

  await delay(50)
  let id = cookieId ?? readVisitanteId()
  if (!id && typeof crypto !== 'undefined') {
    id = crypto.randomUUID()
  }
  const sessao: SessaoVisitante = {
    cookieId: id ?? 'mock-cookie',
    sessaoId: 1,
  }
  persistSessao(sessao)
  return sessao
}

let abrindo: Promise<number> | null = null

/**
 * Sessão da visita atual: reaproveita a que teve evento nos últimos 30 min (recarregar ou abrir outra aba
 * não cria outra) ou abre uma nova. Chamadas simultâneas dividem a mesma abertura.
 */
export function garantirSessao(): Promise<number> {
  const ativa = readSessaoAtiva()
  if (ativa === undefined) return reabrirSessao()
  marcarAtividade()
  return Promise.resolve(ativa)
}

/** Abre outra sessão mesmo que exista uma salva (ex.: o backend não a reconhece mais). */
export function reabrirSessao(): Promise<number> {
  abrindo ??= abrirSessaoVisitante()
    .then((s) => s.sessaoId)
    .finally(() => {
      abrindo = null
    })
  return abrindo
}

export function readSessaoId(): number | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(SESSAO_ID_KEY)
    if (!raw) return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  } catch {
    return undefined
  }
}
