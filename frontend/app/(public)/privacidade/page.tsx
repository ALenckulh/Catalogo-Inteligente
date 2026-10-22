'use client'

import { Typography } from '@/components/ui'

const { Title, Paragraph } = Typography

export default function PrivacidadePage() {
  return (
    <article
      aria-labelledby="privacidade-title"
      style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}
    >
      <Title id="privacidade-title" level={1}>
        Política de Privacidade
      </Title>
      <Paragraph type="secondary">
        Documento simplificado para o Catálogo Inteligente (TCC). Versão mock 1.0.
      </Paragraph>
      <Title level={3}>Dados coletados</Title>
      <Paragraph>
        Dados de cadastro (e-mail, identificação PF/PJ, telefone opcional), consentimentos LGPD
        e, com autorização, eventos comportamentais para recomendação (visualizações, favoritos,
        buscas e filtros).
      </Paragraph>
      <Title level={3}>Finalidade</Title>
      <Paragraph>
        Operar o catálogo, autenticar usuários, personalizar recomendações e permitir contato
        comercial pelo canal WhatsApp externo à plataforma.
      </Paragraph>
      <Title level={3}>Direitos do titular</Title>
      <Paragraph>
        Você pode exportar ou solicitar exclusão de dados em Conta → Privacidade, além de
        revogar cookies comportamentais a qualquer momento.
      </Paragraph>
    </article>
  )
}
