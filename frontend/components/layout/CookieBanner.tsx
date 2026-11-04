'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { Alert, Button, Checkbox, Flex, Modal, Space, Typography } from '@/components/ui'

const { Text } = Typography

export function CookieBanner() {
  const { needsDecision, acceptAll, acceptEssential, acceptCustom } = useCookieConsent()
  const [customOpen, setCustomOpen] = useState(false)
  const [behavioral, setBehavioral] = useState(false)

  if (!needsDecision) return null

  return (
    <>
      {/* sticky como último filho do body: acompanha a tela sem cobrir o footer */}
      <aside
        aria-label="Consentimento de cookies"
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 'var(--z-overlay)',
          paddingBlock: 'var(--space-3)',
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
          <Space wrap>
            <Button id="cookie-accept-all" color="primary" onClick={acceptAll}>
              Aceitar todos
            </Button>
            <Button id="cookie-essential" onClick={acceptEssential}>
              Apenas essenciais
            </Button>
            <Button id="cookie-customize" variant="text" onClick={() => setCustomOpen(true)}>
              Personalizar
            </Button>
          </Space>
        </Flex>
      </aside>

      <Modal
        title="Personalizar cookies"
        open={customOpen}
        centered
        onCancel={() => setCustomOpen(false)}
        okText="Salvar preferências"
        cancelText="Cancelar"
        onOk={() => {
          acceptCustom(behavioral)
          setCustomOpen(false)
        }}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 'var(--space-4)' }}
          title="Cookies essenciais são sempre ativos (sessão, segurança, preferência de consentimento)."
        />
        <Checkbox
          id="cookie-behavioral"
          checked={behavioral}
          onChange={(e) => setBehavioral(e.target.checked)}
        >
          Cookies comportamentais (recomendações e métricas de interesse)
        </Checkbox>
      </Modal>
    </>
  )
}
