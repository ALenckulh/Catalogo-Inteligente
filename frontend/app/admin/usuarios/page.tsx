'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listAdminUsuarios } from '@/lib/api/admin'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { Usuario } from '@/lib/types'
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

const { Title } = Typography

export default function AdminUsuariosPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const [items, setItems] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState<string | undefined>()

  useEffect(() => {
    if (!isAdmin) return
    const t = window.setTimeout(() => {
      setLoading(true)
      void listAdminUsuarios({ q: q || undefined, tipo })
        .then((r) => setItems(r.items))
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(t)
  }, [isAdmin, q, tipo])

  if (authLoading || !isAdmin) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    )
  }

  const columns: TableProps<Usuario>['columns'] = [
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
      title: 'Ações',
      key: 'acoes',
      render: (_, row) => (
        <Link href={`/admin/usuarios/${row.id}`}>
          <Button size="small" id={`admin-user-${row.id}-abrir`}>
            Abrir
          </Button>
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
