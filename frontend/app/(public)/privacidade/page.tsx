'use client'

import { DocumentoLegalCompacto, PRIVACIDADE } from '@/components/LegalConteudo'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { Button, Card, Flex, Switch, Typography } from '@/components/ui'

const { Text } = Typography

/** Com conta, a escolha vale na conta; sem conta, só neste navegador (o banner some depois da primeira escolha). */
function ControleEscolhas() {
  const { isAuthenticated, loading } = useCurrentUser()
  const { canTrackBehavioral, acceptCustom } = useCookieConsent()

  if (loading) return null
  if (isAuthenticated) {
    return (
      <Button id="privacidade-abrir-conta" href="/conta?aba=privacidade">
        Abrir minhas escolhas
      </Button>
    )
  }
  return (
    <Card size="small">
      <Flex justify="space-between" align="center" gap="middle">
        <Flex vertical>
          <Text strong>Cookies comportamentais</Text>
          <Text type="secondary">Vale para este navegador</Text>
        </Flex>
        <Switch
          id="privacidade-cookies"
          aria-label="Cookies comportamentais neste navegador"
          checked={canTrackBehavioral}
          onChange={acceptCustom}
        />
      </Flex>
    </Card>
  )
}

const EXTRAS = { escolhas: <ControleEscolhas /> }

export default function PrivacidadePage() {
  return (
    <article className="page page--narrow">
      <DocumentoLegalCompacto doc={PRIVACIDADE} titulo={1} extras={EXTRAS} />
    </article>
  )
}
