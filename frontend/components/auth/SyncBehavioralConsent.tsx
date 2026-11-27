'use client'

import { useEffect } from 'react'
import { getConta, updateConsentimentos } from '@/lib/api/conta'
import { USE_MOCK } from '@/lib/api/config'
import { liberarEventos } from '@/lib/api/eventos'
import { VERSAO_TERMOS } from '@/lib/config'
import { contaJaDecidiu, marcarContaDecidida, registrarEnvioInicial } from '@/lib/consentSync'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'

/**
 * Leva a escolha deste navegador para a conta que **nunca** decidiu sobre cookies comportamentais.
 * Conta que já decidiu não muda sozinha: antes, entrar num navegador com "Apenas essenciais" revogava
 * o consentimento dado em outro.
 */
export function SyncBehavioralConsent() {
  const { user, isAuthenticated } = useCurrentUser()
  const { canTrackBehavioral, preferences } = useCookieConsent()

  useEffect(() => {
    if (USE_MOCK || !isAuthenticated || !user || preferences.decidedAt === null) return
    const { id } = user
    if (contaJaDecidiu(id)) return
    async function enviar() {
      const { consentimentos } = await getConta(id)
      const decidida = consentimentos.some((c) => c.tipo === 'COOKIES_COMPORTAMENTAIS')
      // De novo depois da espera: a pessoa pode ter trocado em /conta nesse meio-tempo.
      if (!decidida && !contaJaDecidiu(id)) {
        await updateConsentimentos(id, [
          { tipo: 'COOKIES_COMPORTAMENTAIS', aceito: canTrackBehavioral, versaoTermos: VERSAO_TERMOS },
        ])
      }
      marcarContaDecidida(id)
      liberarEventos()
    }
    registrarEnvioInicial(
      enviar().catch(() => {
        /* sem marca: tenta de novo na próxima visita */
      }),
    )
  }, [isAuthenticated, user, canTrackBehavioral, preferences.decidedAt])

  return null
}
