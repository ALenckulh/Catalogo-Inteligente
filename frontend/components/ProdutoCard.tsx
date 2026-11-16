'use client'

import Link from 'next/link'
import { PictureOutlined } from '@ant-design/icons'
import { imagemSrc } from '@/lib/api/config'
import type { Produto } from '@/lib/types'
import { toMoneyBRL } from '@/lib/formatters'
import { Card, Flex, Tag, Typography } from '@/components/ui'

const { Text, Paragraph } = Typography

interface ProdutoCardProps {
  produto: Produto
}

export function ProdutoCard({ produto }: ProdutoCardProps) {
  const imagem = [...produto.imagens].sort((a, b) => a.ordem - b.ordem)[0]
  const href = `/produtos/${produto.slug}`

  return (
    <Link
      href={href}
      id={`produto-card-${produto.slug}`}
      style={{ display: 'block', height: '100%', textDecoration: 'none', color: 'inherit' }}
    >
      <Card
        hoverable
        size="small"
        style={{ height: '100%' }}
        cover={
          <Flex
            align="center"
            justify="center"
            style={{
              width: '100%',
              aspectRatio: '4 / 3',
              background: 'var(--surface-base)',
              color: 'var(--icon-subtle)',
              fontSize: 'var(--font-size-3xl)',
              overflow: 'hidden',
            }}
          >
            {imagem ? (
              <>
                {/* img nativo: evita mismatch de attrs do next/image no SSR */}
                {/* eslint-disable-next-line @next/next/no-img-element -- URL externa ou BLOB da API; next/image causa hydration mismatch no Card */}
                <img
                  src={imagemSrc(imagem.url)}
                  alt={imagem.altText ?? produto.nome}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
              </>
            ) : (
              <PictureOutlined aria-hidden />
            )}
          </Flex>
        }
      >
        <Flex vertical gap="small">
          {produto.categoria && (
            <Tag
              style={{
                alignSelf: 'flex-start',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {produto.categoria.nome}
            </Tag>
          )}
          {/* minHeight: reserva 2 linhas para os cards da fileira ficarem alinhados */}
          <Paragraph
            ellipsis={{ rows: 2, tooltip: produto.nome }}
            style={{ margin: 0, minHeight: '3.2em' }}
          >
            {produto.nome}
          </Paragraph>
          <Text strong>{toMoneyBRL(produto.preco)}</Text>
        </Flex>
      </Card>
    </Link>
  )
}
