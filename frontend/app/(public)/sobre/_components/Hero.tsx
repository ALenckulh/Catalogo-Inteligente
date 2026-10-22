'use client'

import { Badge, Button, Card, Flex, List, Space, Statistic, Tag, Typography } from '@/components/ui'

const { Title, Paragraph, Text } = Typography

const TECH_BADGES: Array<{ label: string; color?: string }> = [
  { label: 'Next.js 16' },
  { label: 'React 19', color: 'blue' },
  { label: 'Python', color: 'gold' },
  { label: 'TypeScript', color: 'blue' },
  { label: 'B2B', color: 'purple' },
  { label: 'LGPD', color: 'green' },
]

const SCORE_METRICS = [
  { label: 'Cliques',   value: 12,     weight: '0.3' },
  { label: 'Favoritos', value: 3,      weight: '0.5' },
  { label: 'Contatos',  value: 2,      weight: '0.8' },
  { label: 'Tempo',     value: '4.2h', weight: '0.4' },
]

export function Hero() {
  return (
    <section id="hero" aria-labelledby="hero-title">
      <Flex
        gap={48}
        wrap="wrap"
        align="center"
        justify="space-between"
        style={{ minHeight: '100vh', padding: '96px 24px' }}
      >
        <Flex vertical gap={24} style={{ maxWidth: 600, flex: '1 1 420px' }}>
          <Space size={8}>
            <Badge status="processing" />
            <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              PAC VIII — 2026/1 · Centro Universitário Católica de SC
            </Text>
          </Space>

          <Title id="hero-title" level={1} style={{ margin: 0, fontSize: 56, lineHeight: 1.1 }}>
            Catálogo B2B <Text style={{ color: 'var(--primary)', fontSize: 'inherit' }}>Inteligente</Text>
          </Title>

          <Paragraph type="secondary" style={{ fontSize: 18, margin: 0 }}>
            Sistema de recomendação baseado em scoring com decaimento temporal
            exponencial — predizendo intenção de compra a partir de{' '}
            <Text strong>uma única interação</Text>, sem depender de volume de dados.
          </Paragraph>

          <Flex gap={8} wrap="wrap" role="list" aria-label="Tecnologias utilizadas">
            {TECH_BADGES.map((b) => (
              <Tag key={b.label} color={b.color} role="listitem">
                {b.label}
              </Tag>
            ))}
          </Flex>

          <Flex gap={12} wrap="wrap">
            <Button variant="solid" color="primary" href="#scoring">
              Ver o Motor de Scoring
            </Button>
            <Button
              variant="outlined"
              href="https://github.com/ALenckulh/Catalogo-Inteligente"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Button>
          </Flex>
        </Flex>

        <Card
          shadow="lg"
          style={{ width: 360, flex: '0 0 auto' }}
          aria-hidden
        >
          <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>
              Score de Intenção
            </Text>
            <Space size={6}>
              <Badge status="success" />
              <Text type="success" style={{ fontSize: 12 }}>Negociação ativa</Text>
            </Space>
          </Flex>

          <Statistic
            value={87.4}
            precision={1}
            styles={{ content: { color: 'var(--primary)', fontSize: 56, fontWeight: 700 } }}
          />

          <Paragraph type="secondary" italic style={{ marginBottom: 16, fontSize: 13 }}>
            Σ peso × evento × e<Text style={{ fontSize: 'smaller' }}>⁻λt</Text>
          </Paragraph>

          <List
            dataSource={SCORE_METRICS}
            rowKey="label"
            split={false}
            renderItem={(m: (typeof SCORE_METRICS)[number]) => (
              <List.Item style={{ padding: '6px 0', border: 'none' }}>
                <Flex
                  justify="space-between"
                  align="center"
                  style={{ width: '100%' }}
                >
                  <Text type="secondary">{m.label}</Text>
                  <Space size={8}>
                    <Text strong>{m.value}</Text>
                    <Text style={{ color: 'var(--secondary)', fontSize: 12 }}>×{m.weight}</Text>
                  </Space>
                </Flex>
              </List.Item>
            )}
          />
        </Card>
      </Flex>
    </section>
  )
}
