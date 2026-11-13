'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FilterOutlined } from '@ant-design/icons'
import { listCategorias } from '@/lib/api/categorias'
import { listProdutos } from '@/lib/api/produtos'
import { useTrackEvent } from '@/lib/hooks/useTrackEvent'
import type { Categoria, Produto } from '@/lib/types'
import { ProdutoCard } from '@/components/ProdutoCard'
import { PageError } from '@/components/layout/PageStates'
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

const { Title, Text } = Typography

const PAGE_SIZE = 12
const PRECO_DEBOUNCE_MS = 400

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

type Filtros = {
  q: string
  categoria: number | undefined
  precoMin: number | undefined
  precoMax: number | undefined
  page: number
}

type FaixaPreco = { min: number | undefined; max: number | undefined }

const faixaKey = ({ min, max }: FaixaPreco) => `${min ?? ''}|${max ?? ''}`

type FiltrosPanelProps = {
  idPrefix: string
  treeData: ReturnType<typeof buildCategoriaTree>
  categoriaId: number | undefined
  preco: FaixaPreco
  precoInvalido: boolean
  onCategoria: (v: number | undefined) => void
  onPreco: (v: FaixaPreco) => void
}

function FiltrosPanel({
  idPrefix,
  treeData,
  categoriaId,
  preco,
  precoInvalido,
  onCategoria,
  onPreco,
}: FiltrosPanelProps) {
  const status = precoInvalido ? 'error' : undefined
  return (
    <Flex vertical gap="middle">
      <Flex vertical gap="small">
        <Text strong>Categoria</Text>
        <TreeSelect
          id={`${idPrefix}-categoria`}
          aria-label="Categoria"
          allowClear
          treeDefaultExpandAll
          placeholder="Selecione a categoria"
          style={{ width: '100%' }}
          value={treeData.length ? categoriaId : undefined}
          treeData={treeData}
          onChange={(v: number | null) => onCategoria(v ?? undefined)}
        />
      </Flex>
      <Flex vertical gap="small">
        <Text strong>Faixa de preço</Text>
        <Flex gap="small">
          <InputNumber
            id={`${idPrefix}-preco-min`}
            aria-label="Preço mínimo"
            min={0}
            step={1}
            placeholder="Mín."
            status={status}
            style={{ width: '100%' }}
            value={preco.min}
            onChange={(v) => onPreco({ ...preco, min: v === null ? undefined : Number(v) })}
          />
          <InputNumber
            id={`${idPrefix}-preco-max`}
            aria-label="Preço máximo"
            min={0}
            step={1}
            placeholder="Máx."
            status={status}
            style={{ width: '100%' }}
            value={preco.max}
            onChange={(v) => onPreco({ ...preco, max: v === null ? undefined : Number(v) })}
          />
        </Flex>
        {precoInvalido && <Text type="danger">O mínimo não pode ser maior que o máximo</Text>}
      </Flex>
    </Flex>
  )
}

export function ProdutosCatalogo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const track = useTrackEvent()

  // A URL é a única fonte de verdade dos filtros (normas §20).
  const q = searchParams.get('q') ?? ''
  const categoriaId = parseNum(searchParams.get('categoria'))
  const precoMin = parseNum(searchParams.get('precoMin'))
  const precoMax = parseNum(searchParams.get('precoMax'))
  const page = Math.max(1, parseNum(searchParams.get('page')) ?? 1)

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [items, setItems] = useState<Produto[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Rascunho do preço: o usuário digita livre e a URL só muda após o debounce.
  const urlFaixa = faixaKey({ min: precoMin, max: precoMax })
  const [preco, setPreco] = useState<FaixaPreco>({ min: precoMin, max: precoMax })
  const [faixaAplicada, setFaixaAplicada] = useState(urlFaixa)
  if (urlFaixa !== faixaAplicada) {
    // A URL mudou por fora (Limpar filtros, link do header): descarta o rascunho.
    setFaixaAplicada(urlFaixa)
    setPreco({ min: precoMin, max: precoMax })
  }
  const precoInvalido =
    preco.min !== undefined && preco.max !== undefined && preco.min > preco.max

  const treeData = useMemo(() => buildCategoriaTree(categorias), [categorias])

  useEffect(() => {
    void listCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    const t = window.setTimeout(() => {
      setLoading(true)
      setFalhou(false)
      listProdutos({
        q: q || undefined,
        categoria: categoriaId,
        precoMin,
        precoMax,
        page,
        limit: PAGE_SIZE,
      })
        .then((res) => {
          if (cancelled) return
          setItems(res.items)
          setTotal(res.total)
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
  }, [q, categoriaId, precoMin, precoMax, page, tentativa])

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
          // Filtrar por categoria indica interesse nela: o motor soma na nota da categoria.
          categoriaId: categoriaId ?? undefined,
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

  const aplicar = useCallback(
    (next: Partial<Filtros>) => {
      const f: Filtros = { q, categoria: categoriaId, precoMin, precoMax, page: 1, ...next }
      const params = new URLSearchParams()
      if (f.q) params.set('q', f.q)
      if (f.categoria !== undefined) params.set('categoria', String(f.categoria))
      if (f.precoMin !== undefined) params.set('precoMin', String(f.precoMin))
      if (f.precoMax !== undefined) params.set('precoMax', String(f.precoMax))
      if (f.page > 1) params.set('page', String(f.page))
      const qs = params.toString()
      router.replace(qs ? `/produtos?${qs}` : '/produtos', { scroll: false })
    },
    [router, q, categoriaId, precoMin, precoMax],
  )

  useEffect(() => {
    const key = faixaKey(preco)
    if (precoInvalido || key === urlFaixa) return
    const t = window.setTimeout(() => {
      setFaixaAplicada(key)
      aplicar({ precoMin: preco.min, precoMax: preco.max })
    }, PRECO_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [preco, precoInvalido, urlFaixa, aplicar])

  function onSearch(value: string) {
    const termo = value.trim()
    aplicar({ q: termo })
    if (termo) track({ tipo: 'PESQUISA', metadados: { termo } })
  }

  function limparFiltros() {
    router.replace('/produtos', { scroll: false })
  }

  const temFiltro = Boolean(q) || categoriaId !== undefined || urlFaixa !== '|'

  const filtrosProps: Omit<FiltrosPanelProps, 'idPrefix'> = {
    treeData,
    categoriaId,
    preco,
    precoInvalido,
    onCategoria: (categoria) => aplicar({ categoria }),
    onPreco: setPreco,
  }

  return (
    <Flex vertical className="page" style={{ gap: 'var(--space-4)' }}>
      <Flex align="center" justify="space-between" wrap="wrap" gap="middle">
        <Flex align="baseline" wrap="wrap" gap="small">
          <Title level={1} style={{ margin: 0 }} id="produtos-title">
            Catálogo
          </Title>
          {!falhou && (
            <Text type="secondary" aria-live="polite">
              {total} {total === 1 ? 'produto' : 'produtos'}
            </Text>
          )}
          {temFiltro && (loading || items.length > 0) && (
            <Button id="produtos-limpar-filtros" variant="link" size="small" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          )}
        </Flex>
        <Flex gap="small" flex="1 1 280px" justify="flex-end">
          <Button
            id="produtos-abrir-filtros"
            className="hide-from-lg"
            icon={<FilterOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Filtros
          </Button>
          <Input.Search
            key={q}
            id="produtos-busca"
            aria-label="Buscar produtos"
            placeholder="Buscar produtos"
            allowClear
            style={{ maxWidth: 360 }}
            defaultValue={q}
            onSearch={onSearch}
          />
        </Flex>
      </Flex>

      <Row gutter={[24, 24]}>
        <Col xs={0} lg={6}>
          <div className="sticky-side">
            <FiltrosPanel idPrefix="produtos" {...filtrosProps} />
          </div>
        </Col>

        <Col xs={24} lg={18}>
          {falhou ? (
            <PageError onRetry={() => setTentativa((n) => n + 1)} />
          ) : (
            <Flex vertical gap="large">
              <Spin spinning={loading}>
                {items.length === 0 && !loading ? (
                  <Empty description="Nenhum produto encontrado">
                    {temFiltro && (
                      <Button id="produtos-limpar-vazio" onClick={limparFiltros}>
                        Limpar filtros
                      </Button>
                    )}
                  </Empty>
                ) : (
                  <Row gutter={[16, 16]} role="list">
                    {items.map((p) => (
                      <Col
                        key={p.id}
                        xs={24}
                        sm={12}
                        md={8}
                        role="listitem"
                        onClickCapture={() => {
                          // Pesquisou e abriu um resultado = interesse alto naquele produto.
                          if (q) {
                            track({
                              tipo: 'PESQUISA',
                              produtoId: p.id,
                              metadados: { termo: q, origem: 'resultado_pesquisa' },
                            })
                          }
                        }}
                      >
                        <ProdutoCard produto={p} />
                      </Col>
                    ))}
                  </Row>
                )}
              </Spin>

              {total > PAGE_SIZE && (
                <Pagination
                  current={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  showSizeChanger={false}
                  onChange={(p) => {
                    aplicar({ page: p })
                    window.scrollTo({ top: 0 })
                  }}
                  style={{ alignSelf: 'center' }}
                />
              )}
            </Flex>
          )}
        </Col>
      </Row>

      <Drawer
        title="Filtros"
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        size={300}
        footer={
          <Button id="produtos-ver-resultados" color="primary" block onClick={() => setDrawerOpen(false)}>
            Ver {total} {total === 1 ? 'produto' : 'produtos'}
          </Button>
        }
      >
        <FiltrosPanel idPrefix="produtos-drawer" {...filtrosProps} />
      </Drawer>
    </Flex>
  )
}
