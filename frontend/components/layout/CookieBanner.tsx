'use client'

import { useState } from 'react'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { Alert, Button, Checkbox, Flex, Modal, Space, Typography } from '@/components/ui'

const { Text, Paragraph } = Typography

export function CookieBanner() {
  const { needsDecision, acceptAll, acceptEssential, acceptCustom } = useCookieConsent()
  const [customOpen, setCustomOpen] = useState(false)
  const [behavioral, setBehavioral] = useState(false)

  if (!needsDecision) return null

  return (
    <>
      <aside
        aria-label="Consentimento de cookies"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          padding: 16,
          background: 'var(--surface-base)',
          borderTop: '1px solid var(--border-neutral-subtle)',
          boxShadow: '0 -4px 16px color-mix(in srgb, var(--neutral-900) 8%, transparent)',
        }}
      >
        <Flex
          vertical
          gap="middle"
          style={{ maxWidth: 960, margin: '0 auto' }}
        >
          <div>
            <Text strong>Cookies e privacidade</Text>
            <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
              Usamos cookies essenciais para o funcionamento do site. Cookies comportamentais
              ajudam a personalizar recomendações — só com o seu consentimento.
            </Paragraph>
          </div>
          <Space wrap>
            <Button id="cookie-accept-all" color="primary" onClick={acceptAll}>
              Aceitar todos
            </Button>
            <Button id="cookie-essential" variant="outlined" onClick={acceptEssential}>
              Apenas essenciais
            </Button>
            <Button
              id="cookie-customize"
              variant="text"
              onClick={() => setCustomOpen(true)}
            >
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
          style={{ marginBottom: 16 }}
          message="Cookies essenciais são sempre ativos (sessão, segurança, preferência de consentimento)."
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
