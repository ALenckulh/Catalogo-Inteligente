'use client'

import { useCallback } from 'react'
import { trackEvent } from '@/lib/api/eventos'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import type { EventoPayload } from '@/lib/types'

/** Dispara evento só com consentimento comportamental. */
export function useTrackEvent() {
  const { canTrackBehavioral } = useCookieConsent()

  return useCallback(
    (payload: EventoPayload) => {
      if (!canTrackBehavioral) return
      void trackEvent(payload)
    },
    [canTrackBehavioral],
  )
}
