'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listCategorias } from '@/lib/api/categorias'
import { listProdutos } from '@/lib/api/produtos'
import type { Categoria, Produto } from '@/lib/types'
import { ProdutoCard } from '@/components/ProdutoCard'
import { Button, Col, Empty, Flex, Row, Spin, Tag, Typography } from '@/components/ui'

const { Title, Paragraph, Text } = Typography

export function VitrineContent() {
  const [destaques, setDestaques] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => {
      void Promise.all([
        listProdutos({ destaque: true, limit: 4 }),
        listCategorias(),
      ]).then(([produtos, cats]) => {
        setDestaques(produtos.items)
        setCategorias(cats.filter((c) => c.parentId === null))
        setLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  if (loading) {
    return (
      <Flex justify="center" style={{ padding: 64 }}>
        <Spin size="large" />
      </Flex>
    )
  }

  return (
    <Flex vertical gap={48} style={{ maxWidth: 1152, margin: '0 auto', padding: '48px 24px 64px' }}>
      <section aria-labelledby="vitrine-hero-title">
        <Title id="vitrine-hero-title" level={1} style={{ marginBottom: 8 }}>
          Catálogo Inteligente
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 17, maxWidth: 560, marginBottom: 24 }}>
          Produtos selecionados para compradores B2B — ficha clara, sem urgência artificial.
        </Paragraph>
        <Link href="/produtos">
          <Button color="primary" id="vitrine-ver-catalogo">
            Ver catálogo
          </Button>
        </Link>
      </section>

      <section aria-labelledby="vitrine-destaques-title">
        <Title id="vitrine-destaques-title" level={2} style={{ marginBottom: 24 }}>
          Destaques
        </Title>
        {destaques.length === 0 ? (
          <Empty description="Nenhum produto disponível" />
        ) : (
          <Row gutter={[24, 24]} role="list">
            {destaques.map((p) => (
              <Col key={p.id} xs={24} sm={12} md={8} lg={6} role="listitem">
                <ProdutoCard produto={p} />
              </Col>
            ))}
          </Row>
        )}
      </section>

      <section aria-labelledby="vitrine-categorias-title">
        <Title id="vitrine-categorias-title" level={2} style={{ marginBottom: 16 }}>
          Categorias em evidência
        </Title>
        <Flex gap="small" wrap="wrap" role="list">
          {categorias.map((c) => (
            <Link key={c.id} href={`/produtos?categoria=${c.id}`} role="listitem">
              <Tag style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}>
                {c.nome}
              </Tag>
            </Link>
          ))}
          {categorias.length === 0 && (
            <Text type="secondary">Nenhuma categoria cadastrada</Text>
          )}
        </Flex>
      </section>
    </Flex>
  )
}
