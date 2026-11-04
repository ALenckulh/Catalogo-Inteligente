'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeleteOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { toApiError } from '@/lib/api/client'
import { addFavorito, listFavoritos, removeFavorito } from '@/lib/api/favoritos'
import { whatsappUrl } from '@/lib/config'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useTrackEvent } from '@/lib/hooks/useTrackEvent'
import type { Favorito } from '@/lib/types'
import { ProdutoCard } from '@/components/ProdutoCard'
import { PageError, PageLoading } from '@/components/layout/PageStates'
import {
  Button,
  Col,
  Empty,
  Flex,
  Row,
  Spin,
  Typography,
} from '@/components/ui'

const { Title, Paragraph } = Typography

const DESFAZER_SEGUNDOS = 8

export default function FavoritosPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useCurrentUser()
  const track = useTrackEvent()
  const { api, contextHolder } = useAppNotification()
  const [items, setItems] = useState<Favorito[]>([])
  const [loading, setLoading] = useState(true)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !user) {
      router.replace('/entrar?next=/favoritos')
    }
  }, [authLoading, isAuthenticated, user, router])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setFalhou(false)
    try {
      setItems(await listFavoritos(user.id))
    } catch {
      setFalhou(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  function devolver(fav: Favorito, posicao: number) {
    setItems((cur) => [...cur.slice(0, posicao), fav, ...cur.slice(posicao)])
  }

  async function desfazer(fav: Favorito, posicao: number) {
    if (!user) return
    devolver(fav, posicao)
    try {
      await addFavorito(user.id, fav.produtoId)
      track({ tipo: 'FAVORITAR', produtoId: fav.produtoId })
    } catch (e) {
      setItems((cur) => cur.filter((f) => f.produtoId !== fav.produtoId))
      api.error({ title: toApiError(e).message })
    }
  }

  /** Reversível: remove na hora e oferece Desfazer, sem confirmação (normas §3). */
  async function onRemove(fav: Favorito) {
    if (!user) return
    const posicao = items.indexOf(fav)
    setItems((cur) => cur.filter((f) => f.produtoId !== fav.produtoId))
    try {
      await removeFavorito(user.id, fav.produtoId)
    } catch (e) {
      devolver(fav, posicao)
      api.error({ title: toApiError(e).message })
      return
    }
    track({ tipo: 'DESFAVORITAR', produtoId: fav.produtoId })

    const key = `favorito-removido-${fav.produtoId}`
    api.success({
      key,
      title: 'Removido dos favoritos',
      description: fav.produto?.nome,
      duration: DESFAZER_SEGUNDOS,
      actions: (
        <Button
          id={`favorito-${fav.produtoId}-desfazer`}
          variant="link"
          size="small"
          onClick={() => {
            api.destroy(key)
            void desfazer(fav, posicao)
          }}
        >
          Desfazer
        </Button>
      ),
    })
  }

  function onContato(produtoId: number, nome: string) {
    track({
      tipo: 'CONTATO_WHATSAPP',
      produtoId,
      conversao: 'FORTE',
    })
    window.open(
      whatsappUrl(`Olá! Tenho interesse no produto (favoritos): ${nome}`),
      '_blank',
      'noopener,noreferrer',
    )
  }

  if (authLoading || !isAuthenticated) return <PageLoading />

  return (
    <Flex vertical className="page" style={{ gap: 'var(--space-4)' }}>
      {contextHolder}
      <div>
        <Title level={1} id="favoritos-title" style={{ marginBottom: 'var(--space-1)' }}>
          Favoritos
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Produtos que você salvou. Fale com o dono do catálogo direto por aqui.
        </Paragraph>
      </div>

      {falhou ? (
        <PageError onRetry={() => void load()} />
      ) : (
        <Spin spinning={loading}>
          {items.length === 0 && !loading ? (
            <Empty description="Você ainda não tem favoritos">
              <Button color="primary" id="favoritos-ver-catalogo" href="/produtos">
                Ver catálogo
              </Button>
            </Empty>
          ) : (
            <Row gutter={[16, 16]} role="list">
              {items.map((f) =>
                f.produto ? (
                  <Col key={f.produtoId} xs={24} sm={12} md={8} lg={6} role="listitem">
                    <Flex vertical gap="small">
                      <ProdutoCard produto={f.produto} />
                      <Flex gap="small">
                        <Button
                          id={`favorito-${f.produtoId}-contato`}
                          variant="outlined"
                          color="primary"
                          icon={<WhatsAppOutlined />}
                          onClick={() => onContato(f.produtoId, f.produto!.nome)}
                          block
                        >
                          Entrar em contato
                        </Button>
                        <Button
                          id={`favorito-${f.produtoId}-remover`}
                          variant="text"
                          color="danger"
                          icon={<DeleteOutlined />}
                          tooltip="Remover dos favoritos"
                          aria-label={`Remover ${f.produto.nome} dos favoritos`}
                          onClick={() => void onRemove(f)}
                        />
                      </Flex>
                    </Flex>
                  </Col>
                ) : null,
              )}
            </Row>
          )}
        </Spin>
      )}
    </Flex>
  )
}
