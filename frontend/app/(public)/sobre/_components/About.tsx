'use client'

import { Alert, Card, Col, Row, Space, Typography } from '@/components/ui'

const { Title, Paragraph, Text } = Typography

const CARDS = [
  {
    icon: '🎯',
    title: 'Problema',
    description:
      'Empresas B2B não conseguem identificar leads qualificados em catálogos digitais porque as negociações ocorrem fora da plataforma (WhatsApp, telefone) e os ciclos de decisão duram meses.',
  },
  {
    icon: '💡',
    title: 'Solução',
    description:
      'Um motor de scoring que atribui intenção de compra a produtos e categorias a partir de dados comportamentais, funcionando a partir de uma única interação — sem massa crítica de usuários.',
  },
  {
    icon: '⚡',
    title: 'Diferencial',
    description:
      'Decaimento temporal calibrado especificamente para ciclos B2B longos, com pausa automática durante negociações ativas — impedindo que leads reais sejam deprioritizados por inatividade passiva.',
  },
  {
    icon: '🔒',
    title: 'Conformidade',
    description:
      'Conformidade com a LGPD por meio de consentimento explícito de cookies para usuários anônimos e checkbox de opt-in para usuários autenticados.',
  },
]

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" style={{ padding: '96px 24px' }}>
      <Space orientation="vertical" size={48} style={{ maxWidth: 1152, margin: '0 auto', display: 'flex' }}>
        <Space orientation="vertical" size={8} align="center" style={{ width: '100%', textAlign: 'center' }}>
          <Title id="about-title" level={2} style={{ margin: 0 }}>Sobre o Projeto</Title>
          <Paragraph type="secondary" style={{ fontSize: 17, maxWidth: 672, margin: 0 }}>
            Um catálogo online com sistema de recomendação focado em ambientes B2B,
            com suporte complementar a B2C.
          </Paragraph>
        </Space>

        <Row gutter={[16, 16]} role="list">
          {CARDS.map((card) => (
            <Col key={card.title} xs={24} sm={12} role="listitem">
              <Card shadow="sm" hoverable style={{ height: '100%' }}>
                <Text style={{ fontSize: 28, display: 'block', marginBottom: 12 }} aria-hidden>
                  {card.icon}
                </Text>
                <Title level={4} style={{ marginTop: 0 }}>{card.title}</Title>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {card.description}
                </Paragraph>
              </Card>
            </Col>
          ))}
        </Row>

        <Alert
          type="info"
          showIcon
          title="Hipótese Central"
          description={
            <Paragraph type="secondary" italic style={{ marginBottom: 0, fontSize: 15 }}>
              &ldquo;Um modelo de scoring baseado em regras ponderadas com decaimento
              temporal, calibrado para os ciclos de compra longos do B2B (e com pausa
              durante negociações ativas), é suficiente para gerar sinais de intenção de
              compra interpretáveis e úteis a partir de{' '}
              <Text strong>uma única interação do usuário</Text> — sem depender de volume
              real de usuários.&rdquo;
            </Paragraph>
          }
        />
      </Space>
    </section>
  )
}
