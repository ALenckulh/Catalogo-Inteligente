'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { deleteProduto, listAdminProdutos, updateProduto } from '@/lib/api/admin'
import { formatDateTime, toMoneyBRL } from '@/lib/formatters'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { Produto } from '@/lib/types'
import {
  Button,
  Flex,
  Input,
  Popconfirm,
  Spin,
  Table,
  Tag,
  Typography,
} from '@/components/ui'
import type { TableProps } from '@/components/ui'
import { EditOutlined, PlusOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function AdminProdutosPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const { api, contextHolder } = useAppNotification()
  const [items, setItems] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  async function reload(term = q) {
    setLoading(true)
    try {
      const res = await listAdminProdutos({ q: term || undefined })
      setItems(res.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    const t = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, q])

  if (authLoading || !isAdmin) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        {contextHolder}
        <Spin />
      </Flex>
    )
  }

  const columns: TableProps<Produto>['columns'] = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      sorter: (a, b) => a.nome.localeCompare(b.nome),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      sorter: (a, b) => a.slug.localeCompare(b.slug),
    },
    {
      title: 'Preço',
      dataIndex: 'preco',
      sorter: (a, b) => a.preco - b.preco,
      render: (v: number) => toMoneyBRL(v),
    },
    {
      title: 'Categoria',
      key: 'cat',
      render: (_, row) => row.categoria?.nome ?? '—',
      sorter: (a, b) => (a.categoria?.nome ?? '').localeCompare(b.categoria?.nome ?? ''),
    },
    {
      title: 'Ativo',
      dataIndex: 'ativo',
      filters: [
        { text: 'Sim', value: true },
        { text: 'Não', value: false },
      ],
      onFilter: (v, row) => row.ativo === v,
      render: (ativo: boolean) => (
        <Tag color={ativo ? 'success' : 'default'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
      ),
    },
    {
      title: 'Atualizado',
      dataIndex: 'updatedAt',
      sorter: (a, b) => a.updatedAt.localeCompare(b.updatedAt),
      render: (d) => formatDateTime(d),
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, row) => (
        <Flex gap={4}>
          <Link href={`/admin/produtos/${row.id}/editar`}>
            <Button
              size="small"
              icon={<EditOutlined />}
              tooltip="Editar produto"
              id={`admin-prod-${row.id}-editar`}
            />
          </Link>
          <Button
            size="small"
            id={`admin-prod-${row.id}-toggle`}
            onClick={() => {
              void updateProduto(row.id, { ativo: !row.ativo }).then(() => {
                api.success({ message: row.ativo ? 'Produto desativado' : 'Produto ativado' })
                void reload()
              })
            }}
          >
            {row.ativo ? 'Desativar' : 'Ativar'}
          </Button>
          <Popconfirm
            title="Remover produto do catálogo?"
            description="Esta ação é permanente e não pode ser desfeita."
            okText="Remover"
            cancelText="Cancelar"
            onConfirm={() => {
              void deleteProduto(row.id).then(() => {
                api.success({ message: 'Produto removido' })
                void reload()
              })
            }}
          >
            <Button size="small" color="danger" id={`admin-prod-${row.id}-excluir`}>
              Excluir
            </Button>
          </Popconfirm>
        </Flex>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <Title level={3} style={{ margin: 0 }} id="admin-produtos-title">
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
        onSearch={setQ}
      />
      <Table
        size="small"
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{ pageSize: 20 }}
      />
    </Flex>
  )
}
