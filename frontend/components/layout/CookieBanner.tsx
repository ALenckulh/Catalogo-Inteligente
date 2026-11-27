'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getConta } from '@/lib/api/conta'
import { marcarContaDecidida } from '@/lib/consentSync'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { Button, Flex, Typography } from '@/components/ui'

const { Text } = Typography

/** Só "Aceitar": recusar ou mudar depois é na página /privacidade ou na aba Privacidade da conta. */
export function CookieBanner() {
  const { needsDecision, acceptAll, acceptCustom } = useCookieConsent()
  const { user, loading } = useCurrentUser()
  /** Conta já consultada; até lá o banner fica oculto, para não piscar para quem já aceitou. */
  const [verificada, setVerificada] = useState<number | null>(null)
  const usuarioId = user?.id

  // Navegador sem escolha adota o aceite da conta. Recusa já gravada neste navegador continua valendo.
  useEffect(() => {
    if (!needsDecision || usuarioId === undefined) return
    let ativo = true
    getConta(usuarioId)
      .then(({ consentimentos }) => {
        const cookies = consentimentos.find((c) => c.tipo === 'COOKIES_COMPORTAMENTAIS')
        if (!ativo || !cookies?.aceito) return
        // Marcada antes: o SyncBehavioralConsent não devolve para a conta a escolha que veio dela.
        marcarContaDecidida(usuarioId)
        acceptCustom(true)
      })
      .catch(() => undefined)
      .finally(() => {
        if (ativo) setVerificada(usuarioId)
      })
    return () => {
      ativo = false
    }
  }, [needsDecision, usuarioId, acceptCustom])

  if (!needsDecision || loading || (usuarioId !== undefined && verificada !== usuarioId)) return null

  return (
    // sticky como último filho do body: acompanha a tela sem cobrir o footer
    <aside
      aria-label="Consentimento de cookies"
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 'var(--z-overlay)',
        paddingBlock: 'var(--space-6)',
        background: 'var(--surface-base)',
        borderTop: 'var(--border-width-default) solid var(--border-neutral-subtle)',
        boxShadow: 'var(--shadow-drop-neutral-md)',
      }}
    >
      <Flex className="shell-inner" wrap="wrap" align="center" justify="space-between" gap="middle">
        <Text type="secondary" style={{ flex: '1 1 320px' }}>
          Usamos cookies essenciais e, com o seu consentimento, comportamentais para
          personalizar recomendações. <Link href="/privacidade">Privacidade</Link>
        </Text>
        <Button id="cookie-accept-all" color="primary" size="large" onClick={acceptAll}>
          Aceitar cookies e continuar
        </Button>
      </Flex>
    </aside>
  )
}
