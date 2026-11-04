'use client'

import { Badge, Button, Card, Flex, Space, Statistic, Tag, Typography } from '@/components/ui'

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

const EYEBROW = { textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 'var(--font-size-base)' } as const

export function Hero() {
  return (
    <section id="hero" aria-labelledby="hero-title">
      <Flex
        className="shell-inner"
        gap={48}
        wrap="wrap"
        align="center"
        justify="space-between"
        style={{ paddingBlock: 'var(--space-12)' }}
      >
        <Flex vertical gap="large" style={{ maxWidth: 600, flex: '1 1 420px' }}>
          <Space size={8}>
            <Badge status="processing" />
            <Text type="secondary" style={EYEBROW}>
              PAC VIII — 2026/1 · Centro Universitário Católica de SC
            </Text>
          </Space>

          <Title
            id="hero-title"
            level={1}
            style={{ margin: 0, fontSize: 'var(--font-size-4xl)', lineHeight: 'var(--line-height-tight)' }}
          >
            Catálogo B2B <Text style={{ color: 'var(--secondary)', fontSize: 'inherit' }}>Inteligente</Text>
          </Title>

          <Paragraph type="secondary" style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>
            Sistema de recomendação baseado em scoring com decaimento temporal
            exponencial — predizendo intenção de compra a partir de{' '}
            <Text strong>uma única interação</Text>, sem depender de volume de dados.
          </Paragraph>

          <Flex gap="small" wrap="wrap" role="list" aria-label="Tecnologias utilizadas">
            {TECH_BADGES.map((b) => (
              <Tag key={b.label} color={b.color} role="listitem">
                {b.label}
              </Tag>
            ))}
          </Flex>

          <Flex gap="small" wrap="wrap">
            <Button color="primary" href="#scoring">
              Ver o Motor de Scoring
            </Button>
            <Button
              href="https://github.com/ALenckulh/Catalogo-Inteligente"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Button>
          </Flex>
        </Flex>

        <Card shadow="lg" style={{ flex: '0 1 360px', maxWidth: '100%' }} aria-hidden>
          <Flex justify="space-between" align="center" style={{ marginBottom: 'var(--space-3)' }}>
            <Text type="secondary" style={EYEBROW}>
              Score de Intenção
            </Text>
            <Space size={8}>
              <Badge status="success" />
              <Text type="success" style={{ fontSize: 'var(--font-size-base)' }}>Negociação ativa</Text>
            </Space>
          </Flex>

          <Statistic
            value={87.4}
            precision={1}
            styles={{
              content: {
                color: 'var(--text-neutral-strong)',
                fontSize: 'var(--font-size-4xl)',
                fontWeight: 'var(--font-weight-bold)',
              },
            }}
          />

          <Paragraph type="secondary" italic style={{ marginBottom: 'var(--space-4)' }}>
            Σ peso × evento × e<Text style={{ fontSize: 'smaller' }}>⁻λt</Text>
          </Paragraph>

          <Flex vertical gap={0}>
            {SCORE_METRICS.map((m) => (
              <Flex
                key={m.label}
                justify="space-between"
                align="center"
                style={{ padding: 'var(--space-2) 0', width: '100%' }}
              >
                <Text type="secondary">{m.label}</Text>
                <Space size={8}>
                  <Text strong>{m.value}</Text>
                  <Text style={{ color: 'var(--secondary)', fontSize: 'var(--font-size-base)' }}>×{m.weight}</Text>
                </Space>
              </Flex>
            ))}
          </Flex>
        </Card>
      </Flex>
    </section>
  )
}
