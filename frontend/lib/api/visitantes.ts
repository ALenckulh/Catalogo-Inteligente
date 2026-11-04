import { delay } from '@/lib/mocks/delay'
import { ApiError, apiClient, toApiError } from './client'
import { SESSAO_ID_KEY, USE_MOCK, VISITANTE_COOKIE_KEY } from './config'

export interface SessaoVisitante {
  cookieId: string
  sessaoId: number
}

function readCookieId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(VISITANTE_COOKIE_KEY)
  } catch {
    return null
  }
}

function persistSessao(sessao: SessaoVisitante): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(VISITANTE_COOKIE_KEY, sessao.cookieId)
    window.localStorage.setItem(SESSAO_ID_KEY, String(sessao.sessaoId))
  } catch {
    /* ignore */
  }
}

async function postSessao(cookieId?: string | null): Promise<SessaoVisitante> {
  const { data } = await apiClient.post<{ cookieId: string; sessaoId: number }>(
    '/visitantes/sessao',
    {
      cookieId: cookieId || undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      canalOrigem: 'web',
    },
  )
  return { cookieId: String(data.cookieId), sessaoId: data.sessaoId }
}

/**
 * Abre/renova sessão de visitante.
 * Backend só aceita cookieId já persistido — se inválido, cria sessão nova.
 */
export async function abrirSessaoVisitante(
  cookieId?: string | null,
): Promise<SessaoVisitante> {
  if (!USE_MOCK) {
    const existing = cookieId ?? readCookieId()
    try {
      const sessao = await postSessao(existing)
      persistSessao(sessao)
      return sessao
    } catch (e) {
      const err = toApiError(e)
      if (existing && (err.status === 400 || err instanceof ApiError)) {
        const sessao = await postSessao(null)
        persistSessao(sessao)
        return sessao
      }
      throw e
    }
  }

  await delay(50)
  let id = cookieId ?? readCookieId()
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
