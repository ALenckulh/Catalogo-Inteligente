'use client'

import { Card, Col, Progress, Row, Space, Steps, Tag, Typography } from '@/components/ui'

const { Title, Paragraph, Text } = Typography

const LAYERS = [
  {
    label: 'Camada 1',
    title: 'Popularidade Global',
    subtitle: 'Cold Start',
    description:
      'Fallback para usuários novos e anônimos. Transição gradual para o score pessoal conforme interações são acumuladas.',
    status: 'implemented' as const,
  },
  {
    label: 'Camada 2',
    title: 'Regras Ponderadas + Decay',
    subtitle: 'Núcleo — Implementado',
    description:
      'Score pessoal com pesos por tipo de interação e decaimento exponencial calibrado por perfil de produto (B2B vs. uso geral). Pausa automática por evento de contato.',
    status: 'implemented' as const,
  },
  {
    label: 'Camada 3',
    title: 'Regras Sequenciais + Grafo/PPR',
    subtitle: 'Trabalho Futuro',
    description:
      'Padrões de navegação e Personalized PageRank em grafo heterogêneo. Exige padrões observáveis em múltiplos usuários.',
    status: 'future' as const,
  },
  {
    label: 'Camada 4',
    title: 'Collaborative Filtering',
    subtitle: 'Trabalho Futuro',
    description:
      'Matrix Factorization e KNN/Neighborhood. Alta precisão, mas exige volume significativo de interações.',
    status: 'future' as const,
  },
]

const METRICS = [
  { label: 'Cliques',               weight: 0.3, icon: '👆' },
  { label: 'Pesquisas',             weight: 0.4, icon: '🔍' },
  { label: 'Favoritos',             weight: 0.5, icon: '⭐' },
  { label: 'Tempo de página',       weight: 0.4, icon: '⏱️' },
  { label: 'Retorno entre sessões', weight: 0.6, icon: '🔄' },
  { label: 'Contato iniciado',      weight: 0.8, icon: '📞' },
]

export function ScoringEngine() {
  return (
    <section
      id="scoring"
      aria-labelledby="scoring-title"
      style={{ padding: '96px 24px', background: 'var(--surface-neutral-subtle)' }}
    >
      <Space orientation="vertical" size={48} style={{ maxWidth: 1152, margin: '0 auto', display: 'flex' }}>
        <Space orientation="vertical" size={8} align="center" style={{ width: '100%', textAlign: 'center' }}>
          <Title id="scoring-title" level={2} style={{ margin: 0 }}>Motor de Scoring</Title>
          <Paragraph type="secondary" style={{ fontSize: 17, maxWidth: 672, margin: 0 }}>
            Arquitetura em camadas — do cold start ao score pessoal calibrado para B2B.
          </Paragraph>
        </Space>

        <Card aria-label="Fórmula do Score de Produto">
          <Space orientation="vertical" size={8} align="center" style={{ width: '100%', textAlign: 'center' }}>
            <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 }}>
              Score de Produto
            </Text>
            <Title level={3} style={{ margin: 0 }}>
              Score ={' '}
              <Text style={{ fontSize: '2em', color: 'var(--primary)' }}>Σ</Text>
              {' '}peso<Text style={{ fontSize: 'smaller' }}>i</Text> × evento<Text style={{ fontSize: 'smaller' }}>i</Text> × e<Text style={{ fontSize: 'smaller' }}>⁻λ × tᵢ</Text>
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              λ calibrado por perfil: menor para B2B de ciclo longo · maior para reposição frequente
            </Text>
          </Space>
        </Card>

        <Row gutter={[12, 12]} role="list" aria-label="Métricas comportamentais e seus pesos">
          {METRICS.map((metric) => (
            <Col key={metric.label} xs={12} md={8} role="listitem">
              <Card size="small">
                <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                  <Space size={8}>
                    <Text style={{ fontSize: 18 }} aria-hidden>{metric.icon}</Text>
                    <Text strong>{metric.label}</Text>
                  </Space>
                  <Progress
                    percent={metric.weight * 100}
                    showInfo={false}
                    strokeColor="var(--primary)"
                    aria-label={`Peso: ${metric.weight}`}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>peso {metric.weight}</Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <Steps
          orientation="vertical"
          current={1}
          aria-label="Camadas da arquitetura de recomendação"
          items={LAYERS.map((layer) => ({
            status: layer.status === 'implemented' ? 'finish' : 'wait',
            title: (
              <Space wrap>
                <Text type="secondary" style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em' }}>
                  {layer.label}
                </Text>
                <Text strong>{layer.title}</Text>
                <Tag color={layer.status === 'implemented' ? 'success' : 'default'}>
                  {layer.subtitle}
                </Tag>
              </Space>
            ),
            content: (
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>{layer.description}</Paragraph>
            ),
          }))}
        />
      </Space>
    </section>
  )
}
