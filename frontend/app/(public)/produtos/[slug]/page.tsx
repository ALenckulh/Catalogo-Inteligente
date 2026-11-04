'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, useParams, useRouter } from 'next/navigation'
import { HeartFilled, HeartOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { toApiError } from '@/lib/api/client'
import { addFavorito, listFavoritos, removeFavorito } from '@/lib/api/favoritos'
import { getProdutoBySlug } from '@/lib/api/produtos'
import { whatsappUrl } from '@/lib/config'
import { toMoneyBRL } from '@/lib/formatters'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useTrackEvent } from '@/lib/hooks/useTrackEvent'
import { entrarHref } from '@/lib/navigation'
import type { Produto } from '@/lib/types'
import { PageError, PageLoading } from '@/components/layout/PageStates'
import {
  Breadcrumb,
  Button,
  Col,
  Descriptions,
  Flex,
  Row,
  Tag,
  Typography,
} from '@/components/ui'

const { Title, Paragraph, Text } = Typography

export default function ProdutoPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug
  const track = useTrackEvent()
  const { user, isAuthenticated } = useCurrentUser()
  const { api, contextHolder } = useAppNotification()

  const [produto, setProduto] = useState<Produto | null>(null)
  const [loading, setLoading] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [tentativa, setTentativa] = useState(0)
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
      setFalhou(false)
      getProdutoBySlug(slug)
        .then((p) => {
          if (!cancelled) setProduto(p)
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
  }, [slug, tentativa])

  useEffect(() => {
    if (!produto || !user || !isAuthenticated) return
    listFavoritos(user.id)
      .then((favs) => setFavorito(favs.some((f) => f.produtoId === produto.id)))
      .catch(() => setFavorito(false))
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
    } catch (e) {
      const erro = toApiError(e)
      if (erro.status === 401) router.push(entrarHref(`/produtos/${slug}`))
      else api.error({ title: erro.message })
    } finally {
      setFavLoading(false)
    }
  }, [produto, user, favorito, track, router, slug, api])

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

  if (loading) return <PageLoading />
  if (falhou) return <PageError onRetry={() => setTentativa((n) => n + 1)} />
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
    <Flex vertical className="page page--has-fixed-cta" style={{ gap: 'var(--space-6)' }}>
      {contextHolder}
      <Breadcrumb
        items={[
          { title: <Link href="/">Vitrine</Link> },
          { title: <Link href="/produtos">Catálogo</Link> },
          { title: produto.nome },
        ]}
      />

      <Row gutter={[32, 24]}>
        <Col xs={24} md={10}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 3',
              maxHeight: 'min(60vh, 480px)',
              background: 'var(--surface-neutral-subtle)',
              borderRadius: 'var(--radius-default)',
              overflow: 'hidden',
            }}
          >
            {principal && (
              <Image
                src={principal.url}
                alt={principal.altText ?? produto.nome}
                fill
                style={{ objectFit: 'contain' }}
                unoptimized
                priority
              />
            )}
          </div>
        </Col>
        <Col xs={24} md={14}>
          <Flex vertical gap="middle">
            {produto.categoria && (
              <Tag style={{ alignSelf: 'flex-start' }}>{produto.categoria.nome}</Tag>
            )}
            <Title level={1} style={{ margin: 0 }} id={`produto-${produto.slug}-titulo`}>
              {produto.nome}
            </Title>
            <Text
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
              }}
            >
              {toMoneyBRL(produto.preco)}
            </Text>

            <Flex className="sticky-cta" gap="small" wrap="wrap">
              {isAuthenticated ? (
                <>
                  <Button
                    id={`produto-${produto.slug}-contato`}
                    color="primary"
                    size="large"
                    icon={<WhatsAppOutlined />}
                    onClick={onContato}
                  >
                    Entrar em contato
                  </Button>
                  <Button
                    id={`produto-${produto.slug}-favoritar`}
                    size="large"
                    icon={favorito ? <HeartFilled /> : <HeartOutlined />}
                    loading={favLoading}
                    aria-pressed={favorito}
                    onClick={() => void toggleFav()}
                  >
                    {favorito ? 'Favoritado' : 'Favoritar'}
                  </Button>
                </>
              ) : (
                <Button
                  id={`produto-${produto.slug}-entrar`}
                  color="primary"
                  size="large"
                  href={entrarHref(`/produtos/${produto.slug}`)}
                >
                  Entrar para contatar
                </Button>
              )}
            </Flex>

            {produto.descricao && (
              <Paragraph
                type="secondary"
                style={{ margin: 0 }}
                ellipsis={{
                  rows: 4,
                  expandable: 'collapsible',
                  symbol: (expanded) => (expanded ? 'Ver menos' : 'Ver mais'),
                }}
              >
                {produto.descricao}
              </Paragraph>
            )}
          </Flex>
        </Col>
      </Row>

      {ficha.length > 0 && (
        <section aria-labelledby="ficha-title">
          <Title level={2} id="ficha-title" style={{ marginTop: 0 }}>
            Ficha técnica
          </Title>
          <Descriptions bordered size="small" column={{ xs: 1, lg: 2 }} items={ficha} />
        </section>
      )}
    </Flex>
  )
}
