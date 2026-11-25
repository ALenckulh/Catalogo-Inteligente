import type { EventoPayload } from '@/lib/types'
import { delay } from '@/lib/mocks/delay'
import { aguardarEnvioInicial } from '@/lib/consentSync'
import { apiClient, toApiError } from './client'
import { AUTH_TOKEN_KEY, USE_MOCK } from './config'
import { garantirSessao, readSessaoId, reabrirSessao } from './visitantes'

interface TrackOptions {
  /**
   * Envio que sobrevive ao fechamento/recarga da aba (fetch com keepalive). Usado em pagehide.
   * Não é sendBeacon porque ele não aceita os headers Authorization e X-Visitante-Cookie-Id.
   */
  keepalive?: boolean
}

/** O backend não conhece mais a sessão ou o visitante salvos neste navegador. */
function sessaoRecusada(e: unknown): boolean {
  return ['INVALID_SESSAO', 'INVALID_COOKIE'].includes(toApiError(e).code)
}

function tokenAtual(): string | null {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

/** Login cuja conta recusou a coleta (403 CONSENT_REQUIRED): não adianta insistir até algo mudar. */
let recusadoCom: string | null = null

/** A conta aceitou a coleta em /conta: volta a enviar. Trocar de login também volta. */
export function liberarEventos(): void {
  recusadoCom = null
}

/**
 * Envia evento comportamental. Caller deve checar CookieConsent antes.
 * A sessão nasce aqui, no primeiro evento: página aberta sem evento não cria sessão.
 * Mock: no-op com delay curto (estrutura pronta para POST /api/eventos).
 */
export async function trackEvent(payload: EventoPayload, options?: TrackOptions): Promise<void> {
  if (!USE_MOCK) {
    const token = tokenAtual()
    if (token !== null && recusadoCom === token) return

    const enviar = (sessaoId: number | undefined) =>
      apiClient.post(
        '/eventos',
        {
          tipo: payload.tipo,
          produtoId: payload.produtoId,
          categoriaId: payload.categoriaId,
          conversao: payload.conversao,
          metadados: payload.metadados,
          sessaoId,
        },
        options?.keepalive ? { adapter: 'fetch', fetchOptions: { keepalive: true } } : undefined,
      )

    // Aba fechando: não dá tempo de abrir outra sessão, e o evento é da visita que está terminando.
    if (options?.keepalive) {
      await enviar(readSessaoId())
      return
    }

    await aguardarEnvioInicial()
    try {
      await enviar(await garantirSessao())
    } catch (e) {
      if (toApiError(e).code === 'CONSENT_REQUIRED') recusadoCom = token
      if (!sessaoRecusada(e)) throw e
      await enviar(await reabrirSessao())
    }
    return
  }

  await delay(50)
  void payload
}
