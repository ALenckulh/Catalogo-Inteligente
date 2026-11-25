'use client'

import { useCallback } from 'react'
import { trackEvent } from '@/lib/api/eventos'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import type { EventoPayload } from '@/lib/types'

/**
 * Dispara evento só com consentimento comportamental (o backend também confere: 403 sem aceite).
 * Fire-and-forget (`void`): a tela não espera nem quebra se o envio falhar.
 */
export function useTrackEvent() {
  const { canTrackBehavioral } = useCookieConsent()

  return useCallback(
    (payload: EventoPayload, options?: { keepalive?: boolean }) => {
      if (!canTrackBehavioral) return
      void trackEvent(payload, options).catch(() => {
        /* fire-and-forget */
      })
    },
    [canTrackBehavioral],
  )
}
