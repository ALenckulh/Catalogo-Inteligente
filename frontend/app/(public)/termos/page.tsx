'use client'

import { Typography } from '@/components/ui'

const { Title, Paragraph } = Typography

export default function TermosPage() {
  return (
    <article
      aria-labelledby="termos-title"
      style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 64px' }}
    >
      <Title id="termos-title" level={1}>
        Termos de Uso
      </Title>
      <Paragraph type="secondary">
        Documento simplificado para o Catálogo Inteligente (TCC). Versão mock 1.0.
      </Paragraph>
      <Title level={3}>Objeto</Title>
      <Paragraph>
        O sistema apresenta catálogo de produtos B2B com recomendação por scoring. Não há
        carrinho nem pagamento na plataforma — a conversão ocorre via contato externo
        (WhatsApp).
      </Paragraph>
      <Title level={3}>Contas</Title>
      <Paragraph>
        Usuários PF e PJ são responsáveis pela veracidade dos dados. Contas administrativas
        são provisionadas pela TI, sem auto-cadastro.
      </Paragraph>
      <Title level={3}>Uso aceitável</Title>
      <Paragraph>
        É vedado uso abusivo da API de eventos, scraping agressivo ou tentativa de acesso à
        área administrativa sem autorização.
      </Paragraph>
    </article>
  )
}
