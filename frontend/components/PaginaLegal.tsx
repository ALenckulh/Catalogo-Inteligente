'use client'

import Link from 'next/link'
import { CheckOutlined } from '@ant-design/icons'
import {
  DocumentoLegal,
  LEGAL_ATUALIZACAO,
  PRIVACIDADE,
  TERMOS,
  idDaSecao,
  tituloNumerado,
  type DocumentoLegalDados,
} from '@/components/LegalConteudo'
import { Card, Col, Flex, Row, Typography } from '@/components/ui'

const { Title, Text } = Typography

/** Página dos Termos. A Política (/privacidade) usa o formato do modal: DocumentoLegalCompacto. */
export function PaginaLegal({ doc }: { doc: DocumentoLegalDados }) {
  const outro = doc.id === 'termos' ? PRIVACIDADE : TERMOS
  return (
    <article aria-labelledby={`${doc.id}-title`} className="page">
      <div>
        <Title id={`${doc.id}-title`} level={1} style={{ marginTop: 0, marginBottom: 'var(--space-1)' }}>
          {doc.titulo}
        </Title>
        <Text type="secondary">
          {LEGAL_ATUALIZACAO} · Veja também <Link href={`/${outro.id}`}>{outro.titulo}</Link>
        </Text>
      </div>

      <Row gutter={[32, 24]}>
        <Col xs={24} lg={17}>
          <Flex vertical gap="large">
            <Card>
              <section aria-labelledby={`${doc.id}-resumo`}>
                <Title id={`${doc.id}-resumo`} level={2} style={{ marginTop: 0 }}>
                  Em resumo
                </Title>
                <Row gutter={[24, 16]} role="list">
                  {doc.resumo.map((r) => (
                    <Col key={r} xs={24} sm={12} role="listitem">
                      <Flex gap="small" align="flex-start">
                        <CheckOutlined aria-hidden style={{ color: 'var(--text-success)', marginTop: 'var(--space-1)' }} />
                        <Text>{r}</Text>
                      </Flex>
                    </Col>
                  ))}
                </Row>
              </section>
            </Card>
            <div>
              <DocumentoLegal doc={doc} />
            </div>
          </Flex>
        </Col>
        <Col xs={0} lg={7}>
          <nav aria-label="Nesta página" className="sticky-side">
            <Flex vertical gap="small">
              <Text strong>Nesta página</Text>
              {doc.secoes.map((s) => (
                <Typography.Link key={s.id} href={`#${idDaSecao(doc, s.id)}`}>
                  {tituloNumerado(doc, s.id)}
                </Typography.Link>
              ))}
            </Flex>
          </nav>
        </Col>
      </Row>
    </article>
  )
}
