'use client'

import { Col, Divider, Layout, Row, Space, Typography } from '@/components/ui'

const { Title, Paragraph, Text, Link } = Typography
const { Footer: AntFooter } = Layout

const REFS = [
  { id: 1, authors: 'LINDEN, G.; SMITH, B.; YORK, J.', title: 'Amazon.com Recommendations: Item-to-Item Collaborative Filtering', venue: 'IEEE Internet Computing, v. 7, n. 1, 2003', url: 'https://doi.org/10.1109/MIC.2003.1167344' },
  { id: 2, authors: 'YING, R. et al.', title: 'Graph Convolutional Neural Networks for Web-Scale Recommender Systems', venue: 'ACM SIGKDD, 2018', url: 'https://doi.org/10.1145/3219819.3219890' },
  { id: 3, authors: 'GOMEZ-URIBE, C. A.; HUNT, N.', title: 'The Netflix Recommender System: Algorithms, Business Value, and Innovation', venue: 'ACM TMIS, v. 6, n. 4, 2015', url: 'https://doi.org/10.1145/2843948' },
  { id: 4, authors: 'KOREN, Y.; BELL, R.; VOLINSKY, C.', title: 'Matrix Factorization Techniques for Recommender Systems', venue: 'IEEE Computer, v. 42, n. 8, 2009', url: 'https://doi.org/10.1109/MC.2009.263' },
]

export function Footer() {
  return (
    <AntFooter role="contentinfo" style={{ padding: '56px 24px 32px' }}>
      <Space orientation="vertical" size={40} style={{ maxWidth: 1152, margin: '0 auto', display: 'flex' }}>
        <Row gutter={[32, 32]}>
          <Col xs={24} md={10}>
            <Title level={4} style={{ margin: 0 }}>Catálogo Inteligente</Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Predição de Intenção de Compra em Catálogos B2B
            </Paragraph>
          </Col>

          <Col xs={24} md={8}>
            <Space orientation="vertical" size={4}>
              <Text strong>Ana Paula Lenckulh</Text>
              <Link href="mailto:lenckulh.ola@gmail.com" aria-label="Email da autora">
                lenckulh.ola@gmail.com
              </Link>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Centro Universitário Católica de Santa Catarina — Jaraguá do Sul, SC, Brasil
              </Text>
            </Space>
          </Col>

          <Col xs={24} md={6}>
            <Space orientation="vertical" size={6}>
              <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>
                Links
              </Text>
              <nav aria-label="Links do projeto">
                <Space orientation="vertical" size={4}>
                  <Link href="https://github.com/ALenckulh/Catalogo-Inteligente" target="_blank" rel="noopener noreferrer">GitHub</Link>
                  <Link href="#about">Sobre o Projeto</Link>
                  <Link href="#scoring">Motor de Scoring</Link>
                  <Link href="#models">Modelos</Link>
                  <Link href="#timeline">Cronograma</Link>
                </Space>
              </nav>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: 0 }} />

        <Space orientation="vertical" size={12}>
          <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 12 }}>
            Referências
          </Text>
          <Space orientation="vertical" size={10} role="list">
            {REFS.map((ref) => (
              <Text key={ref.id} role="listitem" type="secondary" style={{ fontSize: 13 }}>
                <Text strong>{ref.authors}</Text>{' '}
                <Link href={ref.url} target="_blank" rel="noopener noreferrer" italic>
                  {ref.title}
                </Link>
                . <Text type="secondary" style={{ opacity: 0.7 }}>{ref.venue}.</Text>
              </Text>
            ))}
          </Space>
        </Space>

        <Divider style={{ margin: 0 }} />

        <Text type="secondary" style={{ textAlign: 'center', display: 'block', fontSize: 13 }}>
          PAC VIII — 2026/1 · SBC Computing Reviews · Licença MIT
        </Text>
      </Space>
    </AntFooter>
  )
}
