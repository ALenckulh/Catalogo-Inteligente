'use client'

import { useEffect } from 'react'
import { getConta, updateConsentimentos } from '@/lib/api/conta'
import { USE_MOCK } from '@/lib/api/config'
import { isConsentSynced, syncConsent } from '@/lib/consentSync'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'

/**
 * Espelha cookies comportamentais locais no consentimento LGPD do usuário autenticado.
 * Só grava quando o valor difere do vigente no backend; a marca em localStorage (sobrevive a
 * recarregar e a novo login) evita repetir a consulta.
 */
export function SyncBehavioralConsent() {
  const { user, isAuthenticated } = useCurrentUser()
  const { canTrackBehavioral, preferences } = useCookieConsent()

  useEffect(() => {
    if (USE_MOCK || !isAuthenticated || !user || preferences.decidedAt === null) return
    if (isConsentSynced(user.id, canTrackBehavioral)) return
    void syncConsent(user.id, canTrackBehavioral, async () => {
      // Sem marca neste navegador: o backend pode já ter o mesmo valor (cadastro, outro dispositivo).
      const { consentimentos } = await getConta(user.id)
      const vigente = consentimentos.find((c) => c.tipo === 'COOKIES_COMPORTAMENTAIS')
      if (vigente?.aceito === canTrackBehavioral) return
      await updateConsentimentos(user.id, [
        {
          tipo: 'COOKIES_COMPORTAMENTAIS',
          aceito: canTrackBehavioral,
          versaoTermos: '1.0',
        },
      ])
    }).catch(() => {
      /* sem marca: tenta de novo na próxima visita */
    })
  }, [isAuthenticated, user, canTrackBehavioral, preferences.decidedAt])

  return null
}
