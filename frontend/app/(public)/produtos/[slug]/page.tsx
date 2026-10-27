'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { HeartFilled, HeartOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { addFavorito, listFavoritos, removeFavorito } from '@/lib/api/favoritos'
import { getProdutoBySlug } from '@/lib/api/produtos'
import { whatsappUrl } from '@/lib/config'
import { toMoneyBRL } from '@/lib/formatters'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { useTrackEvent } from '@/lib/hooks/useTrackEvent'
import type { Produto } from '@/lib/types'
import {
  Breadcrumb,
  Button,
  Col,
  Descriptions,
  Divider,
  Flex,
  Row,
  Spin,
  Tag,
  Typography,
} from '@/components/ui'

const { Title, Paragraph, Text } = Typography

export default function ProdutoPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const track = useTrackEvent()
  const { user, isAuthenticated } = useCurrentUser()

  const [produto, setProduto] = useState<Produto | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorito, setFavorito] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const viewed = useRef(false)
  const marks = useRef(new Set<number>())
  const activeMs = useRef(0)
  const lastTick = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      setLoading(true)
      void getProdutoBySlug(slug).then((p) => {
        if (cancelled) return
        setProduto(p)
        setLoading(false)
      })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [slug])

  useEffect(() => {
    if (!produto || !user || !isAuthenticated) return
    void listFavoritos(user.id).then((favs) => {
      setFavorito(favs.some((f) => f.produtoId === produto.id))
    })
  }, [produto, user, isAuthenticated])

  useEffect(() => {
    if (!produto || viewed.current) return
    viewed.current = true
    track({ tipo: 'VISUALIZACAO_PRODUTO', produtoId: produto.id })
  }, [produto, track])

  useEffect(() => {
    if (!produto) return

    function onScroll() {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      if (max <= 0) return
      const pct = Math.round((window.scrollY / max) * 100)
      for (const mark of [25, 50, 75, 100]) {
        if (pct >= mark && !marks.current.has(mark)) {
          marks.current.add(mark)
          track({
            tipo: 'SCROLL_DEPTH',
            produtoId: produto!.id,
            metadados: { pct: mark },
          })
        }
      }
    }

    function tick() {
      if (document.visibilityState === 'visible') {
        const now = Date.now()
        if (lastTick.current) activeMs.current += now - lastTick.current
        lastTick.current = now
      } else {
        lastTick.current = null
      }
    }

    lastTick.current = Date.now()
    const interval = window.setInterval(tick, 1000)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', tick)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', tick)
      const seconds = Math.round(activeMs.current / 1000)
      if (seconds > 0) {
        track({
          tipo: 'TEMPO_PAGINA',
          produtoId: produto.id,
          metadados: { segundos_ativos: seconds },
        })
      }
    }
  }, [produto, track])

  const toggleFav = useCallback(async () => {
    if (!produto || !user) return
    setFavLoading(true)
    try {
      if (favorito) {
        await removeFavorito(user.id, produto.id)
        setFavorito(false)
        track({ tipo: 'DESFAVORITAR', produtoId: produto.id })
      } else {
        await addFavorito(user.id, produto.id)
        setFavorito(true)
        track({ tipo: 'FAVORITAR', produtoId: produto.id })
      }
    } finally {
      setFavLoading(false)
    }
  }, [produto, user, favorito, track])

  function onContato() {
    if (!produto) return
    track({
      tipo: 'CONTATO_WHATSAPP',
      produtoId: produto.id,
      conversao: 'LEVE',
    })
    window.open(
      whatsappUrl(`Olá! Tenho interesse no produto: ${produto.nome}`),
      '_blank',
      'noopener,noreferrer',
    )
  }

  if (loading) {
    return (
      <Flex justify="center" style={{ padding: 64 }}>
        <Spin size="large" />
      </Flex>
    )
  }

  if (!produto) return notFound()

  const imagens = [...produto.imagens].sort((a, b) => a.ordem - b.ordem)
  const principal = imagens[0]
  const ficha = produto.fichaTecnica
    ? Object.entries(produto.fichaTecnica).map(([key, value]) => ({
        key,
        label: key,
        children: value,
      }))
    : []

  return (
    <Flex vertical gap={24} style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px 80px' }}>
      <Breadcrumb
        items={[
          { title: <Link href="/">Vitrine</Link> },
          { title: <Link href="/produtos">Catálogo</Link> },
          { title: produto.nome },
        ]}
      />

      <Row gutter={[32, 32]}>
        <Col xs={24} md={12}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              background: 'var(--surface-neutral-subtle)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {principal && (
              <Image
                src={principal.url}
                alt={principal.altText ?? produto.nome}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
                priority
              />
            )}
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Flex vertical gap="middle">
            {produto.categoria && <Tag>{produto.categoria.nome}</Tag>}
            <Title level={2} style={{ margin: 0 }} id={`produto-${produto.slug}-titulo`}>
              {produto.nome}
            </Title>
            <Text style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-neutral-strong)' }}>
              {toMoneyBRL(produto.preco)}
            </Text>
            {produto.descricao && <Paragraph type="secondary">{produto.descricao}</Paragraph>}

            <Flex gap="small" wrap="wrap">
              {isAuthenticated ? (
                <>
                  <Button
                    id={`produto-${produto.slug}-contato`}
                    color="primary"
                    icon={<WhatsAppOutlined />}
                    onClick={onContato}
                  >
                    Entrar em contato
                  </Button>
                  <Button
                    id={`produto-${produto.slug}-favoritar`}
                    icon={favorito ? <HeartFilled /> : <HeartOutlined />}
                    loading={favLoading}
                    onClick={() => void toggleFav()}
                    tooltip={favorito ? 'Remover dos favoritos' : 'Favoritar'}
                  >
                    {favorito ? 'Favoritado' : 'Favoritar'}
                  </Button>
                </>
              ) : (
                <Link href={`/entrar?next=/produtos/${produto.slug}`}>
                  <Button id={`produto-${produto.slug}-entrar`} color="primary">
                    Entrar para contatar
                  </Button>
                </Link>
              )}
            </Flex>
          </Flex>
        </Col>
      </Row>

      {ficha.length > 0 && (
        <>
          <Divider />
          <section aria-labelledby="ficha-title">
            <Title level={3} id="ficha-title">
              Ficha técnica
            </Title>
            <Descriptions bordered size="small" column={1} items={ficha} />
          </section>
        </>
      )}
    </Flex>
  )
}
