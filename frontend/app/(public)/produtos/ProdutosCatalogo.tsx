'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FilterOutlined } from '@ant-design/icons'
import { listCategorias } from '@/lib/api/categorias'
import { listProdutos } from '@/lib/api/produtos'
import { useTrackEvent } from '@/lib/hooks/useTrackEvent'
import type { Categoria, Produto } from '@/lib/types'
import { ProdutoCard } from '@/components/ProdutoCard'
import {
  Button,
  Col,
  Drawer,
  Empty,
  Flex,
  Input,
  InputNumber,
  Pagination,
  Row,
  Spin,
  TreeSelect,
  Typography,
} from '@/components/ui'

const { Title, Paragraph, Text } = Typography

function buildCategoriaTree(categorias: Categoria[]) {
  const byParent = new Map<number | null, Categoria[]>()
  for (const c of categorias) {
    const key = c.parentId
    const list = byParent.get(key) ?? []
    list.push(c)
    byParent.set(key, list)
  }
  function nodes(parentId: number | null): { title: string; value: number; children?: ReturnType<typeof nodes> }[] {
    return (byParent.get(parentId) ?? []).map((c) => {
      const children = nodes(c.id)
      return {
        title: c.nome,
        value: c.id,
        ...(children.length ? { children } : {}),
      }
    })
  }
  return nodes(null)
}

function parseNum(v: string | null): number | undefined {
  if (v === null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

type FiltrosPanelProps = {
  treeData: ReturnType<typeof buildCategoriaTree>
  categoriaId: number | undefined
  precoMin: number | undefined
  precoMax: number | undefined
  onCategoria: (v: number | undefined) => void
  onPrecoMin: (v: number | undefined) => void
  onPrecoMax: (v: number | undefined) => void
}

function FiltrosPanel({
  treeData,
  categoriaId,
  precoMin,
  precoMax,
  onCategoria,
  onPrecoMin,
  onPrecoMax,
}: FiltrosPanelProps) {
  return (
    <Flex vertical gap="middle">
      <Text strong>Categoria</Text>
      <TreeSelect
        id="produtos-categoria"
        allowClear
        treeDefaultExpandAll
        placeholder="Selecione a categoria"
        style={{ width: '100%' }}
        value={categoriaId}
        treeData={treeData}
        onChange={(v: number | null) => onCategoria(v ?? undefined)}
      />
      <Text strong>Faixa de preço</Text>
      <Flex gap="small">
        <InputNumber
          id="produtos-preco-min"
          min={0}
          step={0.5}
          placeholder="Mín."
          style={{ width: '100%' }}
          value={precoMin}
          onChange={(v) => onPrecoMin(v === null ? undefined : Number(v))}
        />
        <InputNumber
          id="produtos-preco-max"
          min={0}
          step={0.5}
          placeholder="Máx."
          style={{ width: '100%' }}
          value={precoMax}
          onChange={(v) => onPrecoMax(v === null ? undefined : Number(v))}
        />
      </Flex>
    </Flex>
  )
}

export function ProdutosCatalogo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const track = useTrackEvent()

  const qParam = searchParams.get('q') ?? ''
  const catParam = searchParams.get('categoria')
  const pageParam = Number(searchParams.get('page') ?? '1')
  const precoMinParam = parseNum(searchParams.get('precoMin'))
  const precoMaxParam = parseNum(searchParams.get('precoMax'))

  const [q, setQ] = useState(qParam)
  const [categoriaId, setCategoriaId] = useState<number | undefined>(
    catParam ? Number(catParam) : undefined,
  )
  const [precoMin, setPrecoMin] = useState<number | undefined>(precoMinParam)
  const [precoMax, setPrecoMax] = useState<number | undefined>(precoMaxParam)
  const [page, setPage] = useState(pageParam)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [items, setItems] = useState<Produto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const treeData = useMemo(() => buildCategoriaTree(categorias), [categorias])

  useEffect(() => {
    void listCategorias().then(setCategorias)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listProdutos({
        q: q || undefined,
        categoria: categoriaId,
        precoMin,
        precoMax,
        page,
        limit: 12,
      })
      setItems(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [q, categoriaId, precoMin, precoMax, page])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(t)
  }, [load])

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (
        categoriaId !== undefined ||
        q ||
        precoMin !== undefined ||
        precoMax !== undefined
      ) {
        track({
          tipo: 'FILTRO_APLICADO',
          metadados: {
            filtros: {
              categoria_id: categoriaId ?? null,
              q: q || null,
              precoMin: precoMin ?? null,
              precoMax: precoMax ?? null,
            },
          },
        })
      }
    }, 300)
    return () => window.clearTimeout(t)
  }, [categoriaId, q, precoMin, precoMax, track])

  function syncUrl(next: {
    q?: string
    categoria?: number | null
    precoMin?: number | null
    precoMax?: number | null
    page?: number
  }) {
    const params = new URLSearchParams()
    const qq = next.q !== undefined ? next.q : q
    const cc = next.categoria !== undefined ? next.categoria : categoriaId
    const pMin = next.precoMin !== undefined ? next.precoMin : precoMin
    const pMax = next.precoMax !== undefined ? next.precoMax : precoMax
    const pp = next.page ?? page
    if (qq) params.set('q', qq)
    if (cc) params.set('categoria', String(cc))
    if (pMin !== undefined && pMin !== null) params.set('precoMin', String(pMin))
    if (pMax !== undefined && pMax !== null) params.set('precoMax', String(pMax))
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

  function onCategoria(next: number | undefined) {
    setCategoriaId(next)
    setPage(1)
    syncUrl({ categoria: next ?? null, page: 1 })
  }

  function onPrecoMin(next: number | undefined) {
    setPrecoMin(next)
    setPage(1)
    syncUrl({ precoMin: next ?? null, page: 1 })
  }

  function onPrecoMax(next: number | undefined) {
    setPrecoMax(next)
    setPage(1)
    syncUrl({ precoMax: next ?? null, page: 1 })
  }

  function limparFiltros() {
    setQ('')
    setCategoriaId(undefined)
    setPrecoMin(undefined)
    setPrecoMax(undefined)
    setPage(1)
    router.replace('/produtos')
  }

  const filtrosProps: FiltrosPanelProps = {
    treeData,
    categoriaId,
    precoMin,
    precoMax,
    onCategoria,
    onPrecoMin,
    onPrecoMax,
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

      <Row gutter={[24, 24]}>
        <Col xs={0} lg={6}>
          <FiltrosPanel {...filtrosProps} />
        </Col>

        <Col xs={24} lg={18}>
          <Flex vertical gap={24}>
            <Flex gap="middle" wrap="wrap" align="center">
              <Button
                id="produtos-abrir-filtros"
                icon={<FilterOutlined />}
                onClick={() => setDrawerOpen(true)}
                className="produtos-filtros-btn"
              >
                Filtros
              </Button>
              <Input.Search
                id="produtos-busca"
                placeholder="Informe o termo de busca"
                allowClear
                style={{ maxWidth: 360, flex: 1 }}
                defaultValue={qParam}
                onSearch={onSearch}
              />
            </Flex>

            <Spin spinning={loading}>
              {items.length === 0 && !loading ? (
                <Empty description="Nenhum produto encontrado">
                  <Button id="produtos-limpar-filtros" onClick={limparFiltros}>
                    Limpar filtros
                  </Button>
                </Empty>
              ) : (
                <Row gutter={[24, 24]} role="list">
                  {items.map((p) => (
                    <Col key={p.id} xs={24} sm={12} md={8} role="listitem">
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
        </Col>
      </Row>

      <Drawer
        title="Filtros"
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={300}
      >
        <FiltrosPanel {...filtrosProps} />
      </Drawer>

      {/* Sidebar cobre filtros no desktop; botão só no mobile */}
      <style>{`
        @media (min-width: 992px) {
          .produtos-filtros-btn { display: none !important; }
        }
      `}</style>
    </Flex>
  )
}
