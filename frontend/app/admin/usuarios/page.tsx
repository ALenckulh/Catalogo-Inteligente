'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listAdminUsuarios } from '@/lib/api/admin'
import { listCategorias } from '@/lib/api/categorias'
import { formatDateTime } from '@/lib/formatters'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { AdminUsuarioListItem, Categoria } from '@/lib/types'
import {
  Button,
  Flex,
  Input,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
} from '@/components/ui'
import type { TableProps } from '@/components/ui'
import { EyeOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function AdminUsuariosPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const [items, setItems] = useState<AdminUsuarioListItem[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState<string | undefined>()
  const [categoria, setCategoria] = useState<string | undefined>()

  useEffect(() => {
    if (!isAdmin) return
    void listCategorias().then(setCategorias)
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    const t = window.setTimeout(() => {
      setLoading(true)
      void listAdminUsuarios({ q: q || undefined, tipo, categoria })
        .then((r) => setItems(r.items))
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(t)
  }, [isAdmin, q, tipo, categoria])

  if (authLoading || !isAdmin) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    )
  }

  const columns: TableProps<AdminUsuarioListItem>['columns'] = [
    {
      title: 'Identificador',
      key: 'nome',
      sorter: (a, b) =>
        (a.nomeCompleto ?? a.razaoSocial ?? '').localeCompare(
          b.nomeCompleto ?? b.razaoSocial ?? '',
        ),
      render: (_, row) => row.nomeCompleto ?? row.razaoSocial ?? '—',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      filters: [
        { text: 'PF', value: 'PF' },
        { text: 'PJ', value: 'PJ' },
      ],
      onFilter: (v, row) => row.tipo === v,
      render: (t) => <Tag>{t}</Tag>,
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Telefone',
      dataIndex: 'telefone',
      render: (t) => t ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      filters: [
        { text: 'Ativo', value: true },
        { text: 'Inativo', value: false },
      ],
      onFilter: (v, row) => row.ativo === v,
      render: (ativo: boolean) => (
        <Tag color={ativo ? 'success' : 'default'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
      ),
    },
    {
      title: 'Score máx.',
      dataIndex: 'scoreMaxProduto',
      sorter: (a, b) => (a.scoreMaxProduto ?? -1) - (b.scoreMaxProduto ?? -1),
      render: (v: number | null) => v ?? '—',
    },
    {
      title: 'Top categoria',
      dataIndex: 'topCategoria',
      sorter: (a, b) => (a.topCategoria ?? '').localeCompare(b.topCategoria ?? ''),
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Última atividade',
      dataIndex: 'ultimaAtividade',
      sorter: (a, b) =>
        (a.ultimaAtividade ?? '').localeCompare(b.ultimaAtividade ?? ''),
      render: (d: string | null) => (d ? formatDateTime(d) : '—'),
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, row) => (
        <Link href={`/admin/usuarios/${row.id}`}>
          <Button
            variant="text"
            size="small"
            icon={<EyeOutlined />}
            tooltip="Abrir"
            id={`admin-user-${row.id}-abrir`}
          />
        </Link>
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      <Title level={3} style={{ margin: 0 }} id="admin-usuarios-title">
        Usuários
      </Title>
      <Flex gap="middle" wrap="wrap">
        <Input.Search
          id="admin-usuarios-busca"
          placeholder="Informe o termo de busca"
          allowClear
          style={{ maxWidth: 280 }}
          onSearch={setQ}
        />
        <Select
          id="admin-usuarios-tipo"
          allowClear
          placeholder="Selecione o tipo"
          style={{ minWidth: 140 }}
          options={[
            { value: 'PF', label: 'PF' },
            { value: 'PJ', label: 'PJ' },
          ]}
          onChange={(v: string | null) => setTipo(v ?? undefined)}
        />
        <Select
          id="admin-usuarios-categoria"
          allowClear
          placeholder="Selecione a categoria"
          style={{ minWidth: 180 }}
          options={categorias.map((c) => ({ value: c.nome, label: c.nome }))}
          onChange={(v: string | null) => setCategoria(v ?? undefined)}
        />
      </Flex>
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
