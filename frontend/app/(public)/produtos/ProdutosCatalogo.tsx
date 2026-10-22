'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { listCategorias } from '@/lib/api/categorias'
import { listProdutos } from '@/lib/api/produtos'
import { useTrackEvent } from '@/lib/hooks/useTrackEvent'
import type { Categoria, Produto } from '@/lib/types'
import { ProdutoCard } from '@/components/ProdutoCard'
import {
  Button,
  Col,
  Empty,
  Flex,
  Input,
  Pagination,
  Row,
  Select,
  Spin,
  Typography,
} from '@/components/ui'

const { Title, Paragraph } = Typography

export function ProdutosCatalogo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const track = useTrackEvent()

  const qParam = searchParams.get('q') ?? ''
  const catParam = searchParams.get('categoria')
  const pageParam = Number(searchParams.get('page') ?? '1')

  const [q, setQ] = useState(qParam)
  const [categoriaId, setCategoriaId] = useState<number | undefined>(
    catParam ? Number(catParam) : undefined,
  )
  const [page, setPage] = useState(pageParam)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [items, setItems] = useState<Produto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void listCategorias().then(setCategorias)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listProdutos({
        q: q || undefined,
        categoria: categoriaId,
        page,
        limit: 12,
      })
      setItems(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [q, categoriaId, page])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (categoriaId !== undefined || q) {
        track({
          tipo: 'FILTRO_APLICADO',
          metadados: {
            filtros: { categoria_id: categoriaId ?? null, q: q || null },
          },
        })
      }
    }, 300)
    return () => window.clearTimeout(t)
  }, [categoriaId, q, track])

  function syncUrl(next: { q?: string; categoria?: number | null; page?: number }) {
    const params = new URLSearchParams()
    const qq = next.q !== undefined ? next.q : q
    const cc = next.categoria !== undefined ? next.categoria : categoriaId
    const pp = next.page ?? page
    if (qq) params.set('q', qq)
    if (cc) params.set('categoria', String(cc))
    if (pp > 1) params.set('page', String(pp))
    const qs = params.toString()
    router.replace(qs ? `/produtos?${qs}` : '/produtos')
  }

  function onSearch(value: string) {
    setQ(value)
    setPage(1)
    syncUrl({ q: value, page: 1 })
    if (value.trim()) {
      track({ tipo: 'PESQUISA', metadados: { termo: value.trim() } })
    }
  }

  return (
    <Flex vertical gap={24} style={{ maxWidth: 1152, margin: '0 auto', padding: '32px 24px 64px' }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }} id="produtos-title">
          Catálogo
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Busque e filtre produtos. Ordenação por relevância mock (popularidade / score).
        </Paragraph>
      </div>

      <Flex gap="middle" wrap="wrap">
        <Input.Search
          id="produtos-busca"
          placeholder="Informe o termo de busca"
          allowClear
          style={{ maxWidth: 360, flex: 1 }}
          defaultValue={qParam}
          onSearch={onSearch}
        />
        <Select
          id="produtos-categoria"
          allowClear
          placeholder="Selecione a categoria"
          style={{ minWidth: 220 }}
          value={categoriaId}
          options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
          onChange={(v: number | null) => {
            const next = v ?? undefined
            setCategoriaId(next)
            setPage(1)
            syncUrl({ categoria: next ?? null, page: 1 })
          }}
        />
      </Flex>

      <Spin spinning={loading}>
        {items.length === 0 && !loading ? (
          <Empty description="Nenhum produto encontrado">
            <Button
              id="produtos-limpar-filtros"
              onClick={() => {
                setQ('')
                setCategoriaId(undefined)
                setPage(1)
                router.replace('/produtos')
              }}
            >
              Limpar filtros
            </Button>
          </Empty>
        ) : (
          <Row gutter={[24, 24]} role="list">
            {items.map((p) => (
              <Col key={p.id} xs={24} sm={12} md={8} lg={6} role="listitem">
                <ProdutoCard produto={p} />
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      {total > 12 && (
        <Pagination
          current={page}
          pageSize={12}
          total={total}
          onChange={(p) => {
            setPage(p)
            syncUrl({ page: p })
          }}
          style={{ alignSelf: 'center' }}
        />
      )}
    </Flex>
  )
}
