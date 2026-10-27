'use client'

import Link from 'next/link'
import type { Produto } from '@/lib/types'
import { toMoneyBRL } from '@/lib/formatters'
import { Card, Tag, Typography } from '@/components/ui'

const { Text, Paragraph } = Typography

interface ProdutoCardProps {
  produto: Produto
}

export function ProdutoCard({ produto }: ProdutoCardProps) {
  const imagem = [...produto.imagens].sort((a, b) => a.ordem - b.ordem)[0]
  const href = `/produtos/${produto.slug}`

  return (
    <Link href={href} id={`produto-card-${produto.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card
        hoverable
        cover={
          imagem ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
                background: 'var(--surface-neutral-subtle)',
                overflow: 'hidden',
              }}
            >
              {/* img nativo: evita mismatch de attrs do next/image no SSR */}
              {/* eslint-disable-next-line @next/next/no-img-element -- placehold.co mock; next/image causa hydration mismatch no Card */}
              <img
                src={imagem.url}
                alt={imagem.altText ?? produto.nome}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ) : undefined
        }
      >
        {produto.categoria && (
          <Tag style={{ marginBottom: 8 }}>{produto.categoria.nome}</Tag>
        )}
        <Text strong ellipsis style={{ display: 'block' }}>
          {produto.nome}
        </Text>
        <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
          {toMoneyBRL(produto.preco)}
        </Paragraph>
      </Card>
    </Link>
  )
}
