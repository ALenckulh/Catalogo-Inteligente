'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listCategorias } from '@/lib/api/categorias'
import { listProdutos } from '@/lib/api/produtos'
import type { Categoria, Produto } from '@/lib/types'
import { ProdutoCard } from '@/components/ProdutoCard'
import { PageError, PageLoading } from '@/components/layout/PageStates'
import { Button, Col, Empty, Flex, Row, Tag, Typography } from '@/components/ui'

const { Title, Paragraph, Text } = Typography

export function VitrineContent() {
  const [destaques, setDestaques] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      setLoading(true)
      setFalhou(false)
      Promise.all([listProdutos({ destaque: true, limit: 4 }), listCategorias()])
        .then(([produtos, cats]) => {
          if (cancelled) return
          setDestaques(produtos.items)
          setCategorias(cats.filter((c) => c.parentId === null))
        })
        .catch(() => {
          if (!cancelled) setFalhou(true)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [tentativa])

  return (
    <Flex vertical className="page">
      <section aria-labelledby="vitrine-hero-title">
        <Title id="vitrine-hero-title" level={1} style={{ marginBottom: 'var(--space-2)' }}>
          Catálogo Inteligente
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 560, marginBottom: 'var(--space-4)' }}>
          Produtos selecionados para compradores B2B — ficha clara, sem urgência artificial.
        </Paragraph>
        <Button color="primary" id="vitrine-ver-catalogo" href="/produtos">
          Ver catálogo
        </Button>
      </section>

      {falhou && <PageError onRetry={() => setTentativa((n) => n + 1)} />}
      {loading && <PageLoading />}

      {!loading && !falhou && (
        <>
          <section aria-labelledby="vitrine-destaques-title">
            <Title id="vitrine-destaques-title" level={2} style={{ marginBottom: 'var(--space-4)' }}>
              Destaques
            </Title>
            {destaques.length === 0 ? (
              <Empty description="Nenhum produto disponível" />
            ) : (
              <Row gutter={[16, 16]} role="list">
                {destaques.map((p) => (
                  <Col key={p.id} xs={24} sm={12} lg={6} role="listitem">
                    <ProdutoCard produto={p} />
                  </Col>
                ))}
              </Row>
            )}
          </section>

          <section aria-labelledby="vitrine-categorias-title">
            <Title id="vitrine-categorias-title" level={2} style={{ marginBottom: 'var(--space-4)' }}>
              Categorias em evidência
            </Title>
            <Flex gap="small" wrap="wrap" role="list">
              {categorias.map((c) => (
                <Link key={c.id} href={`/produtos?categoria=${c.id}`} role="listitem">
                  <Tag
                    style={{
                      cursor: 'pointer',
                      padding: 'var(--space-1) var(--space-3)',
                      fontSize: 'var(--font-size-lg)',
                    }}
                  >
                    {c.nome}
                  </Tag>
                </Link>
              ))}
              {categorias.length === 0 && (
                <Text type="secondary">Nenhuma categoria cadastrada</Text>
              )}
            </Flex>
          </section>
        </>
      )}
    </Flex>
  )
}
