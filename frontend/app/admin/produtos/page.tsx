'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { listAdminProdutos, updateProduto } from '@/lib/api/admin'
import { toApiError } from '@/lib/api/client'
import { toMoneyBRL } from '@/lib/formatters'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import { useTabelaPaginada } from '@/lib/hooks/useTabelaPaginada'
import type { Produto } from '@/lib/types'
import { AtivoTag, DataCelula, TextoCelula } from '@/components/admin/celulas'
import { PageError } from '@/components/layout/PageStates'
import {
  Button,
  Flex,
  Input,
  Spin,
  Table,
  Typography,
} from '@/components/ui'
import type { TableProps } from '@/components/ui'
import {
  CheckCircleOutlined,
  EditOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'

const { Title } = Typography

export default function AdminProdutosPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const { api } = useAppNotification()
  const [q, setQ] = useState('')
  const [ativo, setAtivo] = useState<boolean | undefined>(undefined)

  const buscar = useCallback(
    (params: { page: number; limit: number; sort?: string }) =>
      listAdminProdutos({ q: q || undefined, ativo, ...params }),
    [q, ativo],
  )
  const { items, loading, erro, setPage, reload, onTableChange, sortOrder, pagination } =
    useTabelaPaginada<Produto>(buscar, isAdmin)

  if (authLoading || !isAdmin) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    )
  }

  const columns: TableProps<Produto>['columns'] = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      sorter: true,
      sortOrder: sortOrder('nome'),
      width: '33%',
      render: (v: string) => <TextoCelula texto={v} principal />,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      sorter: true,
      sortOrder: sortOrder('slug'),
      render: (v: string) => <TextoCelula texto={v} />,
    },
    {
      title: 'Preço',
      dataIndex: 'preco',
      sorter: true,
      sortOrder: sortOrder('preco'),
      width: 110,
      render: (v: number) => toMoneyBRL(v),
    },
    {
      title: 'Categoria',
      key: 'cat',
      render: (_, row) => <TextoCelula texto={row.categoria?.nome} />,
    },
    {
      title: 'Ativo',
      dataIndex: 'ativo',
      key: 'ativo',
      filters: [
        { text: 'Sim', value: true },
        { text: 'Não', value: false },
      ],
      filteredValue: ativo === undefined ? null : [ativo],
      width: 86,
      render: (valor: boolean) => <AtivoTag ativo={valor} />,
    },
    {
      title: 'Atualizado',
      dataIndex: 'updatedAt',
      sorter: true,
      sortOrder: sortOrder('updatedAt'),
      width: 116,
      render: (d: string) => <DataCelula data={d} />,
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 84,
      render: (_, row) => (
        <Flex gap={4}>
          <Link href={`/admin/produtos/${row.id}/editar`}>
            <Button
              variant="text"
              size="small"
              icon={<EditOutlined />}
              tooltip="Editar produto"
              id={`admin-prod-${row.id}-editar`}
            />
          </Link>
          <Button
            variant="text"
            size="small"
            icon={row.ativo ? <StopOutlined /> : <CheckCircleOutlined />}
            tooltip={row.ativo ? 'Desativar' : 'Ativar'}
            id={`admin-prod-${row.id}-toggle`}
            onClick={() => {
              void updateProduto(row.id, { ativo: !row.ativo })
                .then(() => {
                  api.success({ title: row.ativo ? 'Produto desativado' : 'Produto ativado' })
                  void reload()
                })
                .catch((e: unknown) => api.error({ title: toApiError(e).message }))
            }}
          />
        </Flex>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Title level={2} style={{ margin: 0 }} id="admin-produtos-title">
          Produtos
        </Title>
        <Link href="/admin/produtos/novo">
          <Button color="primary" icon={<PlusOutlined />} id="admin-prod-novo">
            Novo produto
          </Button>
        </Link>
      </Flex>
      <Input.Search
        id="admin-prod-busca"
        placeholder="Informe o termo de busca"
        allowClear
        style={{ maxWidth: 320 }}
        onSearch={(v) => {
          setQ(v)
          setPage(1)
        }}
      />
      {erro ? (
        <PageError onRetry={() => void reload()} />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={pagination}
          scroll={{ x: 900 }}
          onChange={(p, filters, sorter) => {
            const ativoFiltro = filters.ativo?.length === 1 ? (filters.ativo[0] as boolean) : undefined
            setAtivo(ativoFiltro)
            onTableChange(p, sorter, ativoFiltro !== ativo)
          }}
        />
      )}
    </Flex>
  )
}
