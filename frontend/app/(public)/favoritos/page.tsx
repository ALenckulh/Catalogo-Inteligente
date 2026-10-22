'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WhatsAppOutlined } from '@ant-design/icons'
import { listFavoritos, removeFavorito } from '@/lib/api/favoritos'
import { whatsappUrl } from '@/lib/config'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { useTrackEvent } from '@/lib/hooks/useTrackEvent'
import type { Favorito } from '@/lib/types'
import { ProdutoCard } from '@/components/ProdutoCard'
import {
  Button,
  Col,
  Empty,
  Flex,
  Popconfirm,
  Row,
  Spin,
  Typography,
} from '@/components/ui'

const { Title, Paragraph } = Typography

export default function FavoritosPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useCurrentUser()
  const track = useTrackEvent()
  const [items, setItems] = useState<Favorito[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !user) {
      router.replace('/entrar?next=/favoritos')
    }
  }, [authLoading, isAuthenticated, user, router])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setItems(await listFavoritos(user.id))
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

  async function onRemove(produtoId: number) {
    if (!user) return
    await removeFavorito(user.id, produtoId)
    track({ tipo: 'DESFAVORITAR', produtoId })
    await load()
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

  if (authLoading || !isAuthenticated) {
    return (
      <Flex justify="center" style={{ padding: 64 }}>
        <Spin />
      </Flex>
    )
  }

  return (
    <Flex vertical gap={24} style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div>
        <Title level={2} id="favoritos-title" style={{ marginBottom: 8 }}>
          Favoritos
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Lista de desejos — use o contato por item para conversão.
        </Paragraph>
      </div>

      <Spin spinning={loading}>
        {items.length === 0 && !loading ? (
          <Empty description="Nenhum favorito">
            <Link href="/produtos">
              <Button color="primary" id="favoritos-ver-catalogo">
                Ver catálogo
              </Button>
            </Link>
          </Empty>
        ) : (
          <Row gutter={[24, 24]} role="list">
            {items.map((f) =>
              f.produto ? (
                <Col key={f.produtoId} xs={24} sm={12} md={8} lg={6} role="listitem">
                  <Flex vertical gap="small">
                    <ProdutoCard produto={f.produto} />
                    <Flex gap="small">
                      <Button
                        id={`favorito-${f.produtoId}-contato`}
                        color="primary"
                        icon={<WhatsAppOutlined />}
                        onClick={() => onContato(f.produtoId, f.produto!.nome)}
                        block
                      >
                        Entrar em contato
                      </Button>
                      <Popconfirm
                        title="Remover produto dos favoritos?"
                        description="O item sairá da sua lista de desejos."
                        okText="Remover"
                        cancelText="Cancelar"
                        onConfirm={() => void onRemove(f.produtoId)}
                      >
                        <Button id={`favorito-${f.produtoId}-remover`} color="danger" block>
                          Remover
                        </Button>
                      </Popconfirm>
                    </Flex>
                  </Flex>
                </Col>
              ) : null,
            )}
          </Row>
        )}
      </Spin>
    </Flex>
  )
}
