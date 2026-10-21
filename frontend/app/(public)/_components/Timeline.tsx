'use client'

import { Space, Timeline as AntTimeline, Typography } from '@/components/ui'

const { Title, Paragraph, Text } = Typography

const PHASES = [
  {
    weeks: '1–4',
    title: 'Fundação',
    items: [
      'Modelagem de dados (produto, categoria, interação, usuário)',
      'Implementação da Camada 1 — Popularidade Global',
      'Estrutura base de coleta de métricas comportamentais',
      'Geração do dataset sintético de interações B2B',
    ],
  },
  {
    weeks: '5–8',
    title: 'Motor de Scoring',
    items: [
      'Score de Produto com pesos por tipo de interação',
      'Decaimento exponencial (λ) calibrado por perfil de produto',
      'Pausa de decaimento por evento de contato com vendedor',
      'Transição gradual: fallback global → score pessoal',
    ],
  },
  {
    weeks: '9–12',
    title: 'Funcionalidades Avançadas',
    items: [
      'Score de Categoria — média log-ponderada + boost de conversão',
      'Faixa de preço: conversão vs. apenas visualização',
      'Histórico de compras com threshold mínimo (3 registros)',
      'Consentimento de cookies (conformidade LGPD)',
    ],
  },
  {
    weeks: '13–16',
    title: 'Validação e Entrega',
    items: [
      'Testes de calibração de λ com dados sintéticos variando perfis',
      'Validação de edge cases e cenários de negociação',
      'Redação final do TCC',
      'Preparação e ensaio da defesa',
    ],
  },
]

export function Timeline() {
  return (
    <section
      id="timeline"
      aria-labelledby="timeline-title"
      style={{ padding: '96px 24px', background: 'var(--surface-neutral-subtle)' }}
    >
      <Space orientation="vertical" size={32} style={{ maxWidth: 1152, margin: '0 auto', display: 'flex' }}>
        <Space orientation="vertical" size={8} align="center" style={{ width: '100%', textAlign: 'center' }}>
          <Title id="timeline-title" level={2} style={{ margin: 0 }}>Cronograma</Title>
          <Paragraph type="secondary" style={{ fontSize: 17, maxWidth: 672, margin: 0 }}>
            16 semanas de desenvolvimento a partir da apresentação do PAC VIII.
          </Paragraph>
        </Space>

        <AntTimeline
          mode="start"
          items={PHASES.map((phase) => ({
            title: <Text type="secondary">Semanas {phase.weeks}</Text>,
            content: (
              <Space orientation="vertical" size={6}>
                <Title level={4} style={{ margin: 0 }}>{phase.title}</Title>
                <Space orientation="vertical" size={4} role="list" aria-label={`Entregas: ${phase.title}`}>
                  {phase.items.map((item) => (
                    <Text key={item} role="listitem" type="secondary">→ {item}</Text>
                  ))}
                </Space>
              </Space>
            ),
          }))}
        />
      </Space>
    </section>
  )
}
