'use client'

import { useEffect, useRef } from 'react'
import { updateConsentimentos } from '@/lib/api/conta'
import { USE_MOCK } from '@/lib/api/config'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'

/** Espelha cookies comportamentais locais no consentimento LGPD do usuário autenticado. */
export function SyncBehavioralConsent() {
  const { user, isAuthenticated } = useCurrentUser()
  const { canTrackBehavioral, preferences } = useCookieConsent()
  const lastSynced = useRef<string | null>(null)

  useEffect(() => {
    if (USE_MOCK || !isAuthenticated || !user || preferences.decidedAt === null) return
    const key = `${user.id}:${canTrackBehavioral}`
    if (lastSynced.current === key) return
    lastSynced.current = key
    const now = new Date().toISOString()
    void updateConsentimentos(user.id, [
      {
        tipo: 'COOKIES_COMPORTAMENTAIS',
        aceito: canTrackBehavioral,
        versaoTermos: '1.0',
        aceitoEm: now,
      },
    ]).catch(() => {
      lastSynced.current = null
    })
  }, [isAuthenticated, user, canTrackBehavioral, preferences.decidedAt])

  return null
}
