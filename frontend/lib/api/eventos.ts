import type { EventoPayload } from '@/lib/types'
import { delay } from '@/lib/mocks/delay'
import { apiClient } from './client'
import { USE_MOCK } from './config'
import { readSessaoId } from './visitantes'

/**
 * Envia evento comportamental. Caller deve checar CookieConsent antes.
 * Mock: no-op com delay curto (estrutura pronta para POST /api/eventos).
 */
export async function trackEvent(payload: EventoPayload): Promise<void> {
  if (!USE_MOCK) {
    const sessaoId = readSessaoId()
    await apiClient.post('/eventos', {
      tipo: payload.tipo,
      produtoId: payload.produtoId,
      categoriaId: payload.categoriaId,
      conversao: payload.conversao,
      metadados: payload.metadados,
      sessaoId,
    })
    return
  }

  await delay(50)
  void payload
}
