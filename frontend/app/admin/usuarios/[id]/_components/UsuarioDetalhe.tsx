'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { DeleteOutlined, EditOutlined, PlusOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { deleteCompra, getAdminUsuario, listAdminProdutos } from '@/lib/api/admin'
import { toApiError } from '@/lib/api/client'
import { whatsappUrl } from '@/lib/config'
import { formatDate, formatTelefone, toMoney, toMoneyBRL } from '@/lib/formatters'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { AdminUsuarioDetalhe, Compra, Produto } from '@/lib/types'
import { PageError, PageLoading } from '@/components/layout/PageStates'
import {
  Alert,
  Breadcrumb,
  Button,
  Col,
  Descriptions,
  Empty,
  Flex,
  Popconfirm,
  Row,
  Table,
  Tabs,
  Tooltip,
  Typography,
} from '@/components/ui'
import type { TableProps } from '@/components/ui'
import { CompraModal } from './CompraModal'

const { Title, Text } = Typography

const ABAS = ['scores', 'preco', 'compras'] as const
type Aba = (typeof ABAS)[number]
const isAba = (v: string | null): v is Aba => ABAS.includes(v as Aba)

type ScoreProduto = AdminUsuarioDetalhe['scoresProduto'][number]
type ScoreCategoria = AdminUsuarioDetalhe['scoresCategoria'][number]

export function UsuarioDetalhe() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const router = useRouter()
  const searchParams = useSearchParams()
  const abaUrl = searchParams.get('aba')
  const aba: Aba = isAba(abaUrl) ? abaUrl : 'scores'

  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const { api, contextHolder } = useAppNotification()
  const [data, setData] = useState<AdminUsuarioDetalhe | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [erroCarga, setErroCarga] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const [modal, setModal] = useState<{ open: boolean; compra?: Compra }>({ open: false })

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    const t = window.setTimeout(() => {
      setErroCarga(false)
      void Promise.all([getAdminUsuario(id), listAdminProdutos({ limit: 100 })])
        .then(([detalhe, prods]) => {
          if (cancelled) return
          setData(detalhe)
          setProdutos(prods.items)
        })
        .catch(() => !cancelled && setErroCarga(true))
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [isAdmin, id, tentativa])

  /** Recarrega só o detalhe: compras e scores (recalculados pelo backend). */
  async function recarregar() {
    try {
      setData(await getAdminUsuario(id))
    } catch {
      api.error({ title: 'Não foi possível atualizar os dados do cliente' })
    }
  }

  function trocarAba(key: string) {
    const qs = new URLSearchParams(searchParams.toString())
    qs.set('aba', key)
    router.replace(`/admin/usuarios/${id}?${qs}`, { scroll: false })
  }

  async function excluir(compra: Compra) {
    try {
      await deleteCompra(id, compra.id)
      api.success({ title: 'Compra excluída' })
      await recarregar()
    } catch (e) {
      api.error({ title: 'Não foi possível excluir a compra', description: toApiError(e).message })
    }
  }

  if (erroCarga) {
    return <PageError onRetry={() => setTentativa((n) => n + 1)} />
  }
  if (authLoading || !isAdmin || !data) {
    return (
      <>
        {contextHolder}
        <PageLoading />
      </>
    )
  }

  const { usuario, compras } = data
  const nome = usuario.nomeCompleto ?? usuario.razaoSocial ?? usuario.email
  const tel = usuario.telefone
  const totalCompras = compras.reduce((acc, c) => acc + c.valorTotal, 0)
  const abrirNovaCompra = () => setModal({ open: true })

  const scoreProdutoCols: TableProps<ScoreProduto>['columns'] = [
    {
      title: 'Produto',
      dataIndex: 'produtoNome',
      ellipsis: { showTitle: false },
      sorter: (a, b) => a.produtoNome.localeCompare(b.produtoNome),
      render: (v: string) => <Tooltip title={v}>{v}</Tooltip>,
    },
    {
      title: 'Nota',
      dataIndex: 'valor',
      align: 'right',
      width: 96,
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.valor - b.valor,
      render: (v: number) => toMoney(v),
    },
  ]

  const scoreCategoriaCols: TableProps<ScoreCategoria>['columns'] = [
    {
      title: 'Categoria',
      dataIndex: 'categoriaNome',
      sorter: (a, b) => a.categoriaNome.localeCompare(b.categoriaNome),
    },
    {
      title: 'Nota',
      dataIndex: 'valor',
      align: 'right',
      width: 96,
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.valor - b.valor,
      render: (v: number) => toMoney(v),
    },
  ]

  const compraCols: TableProps<Compra>['columns'] = [
    {
      title: 'Produto',
      dataIndex: 'produtoNome',
      ellipsis: { showTitle: false },
      sorter: (a, b) => (a.produtoNome ?? '').localeCompare(b.produtoNome ?? ''),
      render: (v?: string) => <Tooltip title={v}>{v ?? '—'}</Tooltip>,
    },
    {
      title: 'Qtd',
      dataIndex: 'quantidade',
      align: 'right',
      width: 72,
      sorter: (a, b) => a.quantidade - b.quantidade,
    },
    {
      title: 'Preço unit.',
      dataIndex: 'precoUnitario',
      align: 'right',
      sorter: (a, b) => a.precoUnitario - b.precoUnitario,
      render: (v: number) => toMoneyBRL(v),
    },
    {
      title: 'Total',
      dataIndex: 'valorTotal',
      align: 'right',
      sorter: (a, b) => a.valorTotal - b.valorTotal,
      render: (v: number) => toMoneyBRL(v),
    },
    {
      title: 'Data',
      dataIndex: 'data',
      width: 112,
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.data.localeCompare(b.data),
      render: (d: string) => formatDate(d),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 88,
      render: (_, row) => (
        <Flex gap={4}>
          <Button
            id={`admin-compra-${row.id}-editar`}
            variant="text"
            size="small"
            icon={<EditOutlined />}
            tooltip="Editar compra"
            onClick={() => setModal({ open: true, compra: row })}
          />
          <Popconfirm
            title="Excluir compra?"
            description="A nota do cliente será recalculada. Esta ação não pode ser desfeita."
            okText="Excluir"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            onConfirm={() => excluir(row)}
          >
            <Button
              id={`admin-compra-${row.id}-excluir`}
              variant="text"
              size="small"
              color="danger"
              icon={<DeleteOutlined />}
              tooltip="Excluir compra"
            />
          </Popconfirm>
        </Flex>
      ),
    },
  ]

  const vazio = (descricao: string) => (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={descricao} />
  )

  const abaCompras =
    compras.length === 0 ? (
      <Empty description="Nenhuma compra registrada para este cliente">
        <Button id="admin-compra-nova" variant="outlined" color="primary" icon={<PlusOutlined />} onClick={abrirNovaCompra}>
          Registrar compra
        </Button>
      </Empty>
    ) : (
      <Flex vertical gap="middle">
        {compras.length < 3 && (
          <Alert
            type="info"
            showIcon
            title="Com menos de 3 compras, o histórico de compras ainda não influencia a nota deste cliente."
          />
        )}
        <Flex justify="space-between" align="center" wrap gap="small">
          <Text type="secondary">
            {compras.length} {compras.length === 1 ? 'compra' : 'compras'} · {toMoneyBRL(totalCompras)} no total
          </Text>
          <Button id="admin-compra-nova" variant="outlined" color="primary" icon={<PlusOutlined />} onClick={abrirNovaCompra}>
            Registrar compra
          </Button>
        </Flex>
        <Table
          size="small"
          rowKey="id"
          columns={compraCols}
          dataSource={compras}
          scroll={{ x: 640 }}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          expandable={{
            rowExpandable: (r) => !!r.observacoes,
            expandedRowRender: (r) => <Text type="secondary">{r.observacoes}</Text>,
          }}
        />
      </Flex>
    )

  return (
    <Flex vertical gap="middle">
      {contextHolder}
      <Breadcrumb
        items={[{ title: <Link href="/admin/usuarios">Usuários</Link> }, { title: nome }]}
      />
      <Flex justify="space-between" align="center" wrap gap="middle">
        <Flex vertical gap={4} style={{ minWidth: 0 }}>
          <Title level={1} style={{ margin: 0 }} id="admin-user-detail-title">
            {nome}
          </Title>
          <Text type="secondary">
            {[usuario.tipo, usuario.email, tel && formatTelefone(tel)].filter(Boolean).join(' · ')}
          </Text>
        </Flex>
        <Button
          id="admin-user-whatsapp"
          color="primary"
          icon={<WhatsAppOutlined />}
          disabled={!tel}
          tooltip={!tel ? 'Cliente sem telefone cadastrado' : undefined}
          onClick={() => {
            if (!tel) return
            window.open(whatsappUrl(`Olá ${nome}!`), '_blank', 'noopener,noreferrer')
          }}
        >
          WhatsApp
        </Button>
      </Flex>

      <Tabs
        activeKey={aba}
        onChange={trocarAba}
        items={[
          {
            key: 'scores',
            label: 'Notas de interesse',
            children: (
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Table
                    size="small"
                    rowKey="produtoId"
                    title={() => <Text strong>Por produto</Text>}
                    columns={scoreProdutoCols}
                    dataSource={data.scoresProduto}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                    locale={{ emptyText: vazio('Nenhuma nota por produto ainda') }}
                  />
                </Col>
                <Col xs={24} lg={12}>
                  <Table
                    size="small"
                    rowKey="categoriaId"
                    title={() => <Text strong>Por categoria</Text>}
                    columns={scoreCategoriaCols}
                    dataSource={data.scoresCategoria}
                    pagination={{ pageSize: 10, hideOnSinglePage: true }}
                    locale={{ emptyText: vazio('Nenhuma nota por categoria ainda') }}
                  />
                </Col>
              </Row>
            ),
          },
          {
            key: 'preco',
            label: 'Faixa de preço',
            children: (
              <Flex vertical gap="middle" style={{ maxWidth: 640 }}>
                <Descriptions
                  bordered
                  size="small"
                  column={1}
                  items={[
                    {
                      key: 'com',
                      label: 'Preço mediano — produtos com contato ou compra',
                      children: toMoneyBRL(data.faixaPreco.medianaComConversao),
                    },
                    {
                      key: 'sem',
                      label: 'Preço mediano — produtos só visitados',
                      children: toMoneyBRL(data.faixaPreco.medianaSemConversao),
                    },
                    {
                      key: 'gap',
                      label: 'Diferença',
                      children: toMoneyBRL(data.faixaPreco.gapPreco),
                    },
                  ]}
                />
                {data.faixaPreco.gapPreco > 10 && (
                  <Alert
                    type="warning"
                    showIcon
                    title="A diferença sugere que o preço pode estar afastando este cliente."
                  />
                )}
              </Flex>
            ),
          },
          {
            key: 'compras',
            label: `Compras (${compras.length})`,
            children: abaCompras,
          },
        ]}
      />

      <CompraModal
        open={modal.open}
        usuarioId={id}
        compra={modal.compra}
        produtos={produtos}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSaved={(mensagem) => {
          setModal((m) => ({ ...m, open: false }))
          api.success({ title: mensagem })
          void recarregar()
        }}
      />
    </Flex>
  )
}
