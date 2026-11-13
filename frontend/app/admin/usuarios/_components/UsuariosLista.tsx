'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { listAdminUsuarios } from '@/lib/api/admin'
import { listCategorias } from '@/lib/api/categorias'
import { formatDateTime } from '@/lib/formatters'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { AdminUsuarioListItem, Categoria } from '@/lib/types'
import {
  NIVEIS_INTERESSE,
  isNivelInteresse,
  nivelDoScore,
  type NivelInteresse,
} from '@/lib/nivelInteresse'
import { NivelInteresseIcon } from '@/components/admin/NivelInteresseIcon'
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

type StatusFiltro = boolean[] | null

function statusDaUrl(v: string | null): StatusFiltro {
  if (v === 'ativo') return [true]
  if (v === 'inativo') return [false]
  return null
}

export function UsuariosLista() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nivelUrl = searchParams.get('nivel')
  const nivel: NivelInteresse | undefined = isNivelInteresse(nivelUrl) ? nivelUrl : undefined
  const statusFiltro = statusDaUrl(searchParams.get('status'))

  /** Mantém `nivel` e `status` na URL para que o filtro possa ser compartilhado (ex.: link do dashboard). */
  function atualizarUrl(next: { nivel?: NivelInteresse | null; status?: StatusFiltro }) {
    const params = new URLSearchParams(searchParams.toString())
    if (next.nivel !== undefined) {
      if (next.nivel) params.set('nivel', next.nivel)
      else params.delete('nivel')
    }
    if (next.status !== undefined) {
      const s = next.status
      if (s && s.length === 1) params.set('status', s[0] ? 'ativo' : 'inativo')
      else params.delete('status')
    }
    const qs = params.toString()
    router.replace(qs ? `/admin/usuarios?${qs}` : '/admin/usuarios', { scroll: false })
  }
  const [items, setItems] = useState<AdminUsuarioListItem[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState<string | undefined>()
  const [categoria, setCategoria] = useState<string | undefined>()
  /** Filtro da coluna Tipo (antd exige `filteredValue` em todas as colunas filtráveis quando uma é controlada). */
  const [tipoColuna, setTipoColuna] = useState<string[] | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    void listCategorias().then(setCategorias)
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    const t = window.setTimeout(() => {
      setLoading(true)
      void listAdminUsuarios({ q: q || undefined, tipo, categoria, nivel })
        .then((r) => setItems(r.items))
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(t)
  }, [isAdmin, q, tipo, categoria, nivel])

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
      filteredValue: tipoColuna,
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
      filteredValue: statusFiltro,
      onFilter: (v, row) => row.ativo === v,
      render: (ativo: boolean) => (
        <Tag color={ativo ? 'success' : 'default'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
      ),
    },
    {
      title: 'Score máx.',
      dataIndex: 'scoreMaxProduto',
      sorter: (a, b) => (a.scoreMaxProduto ?? -1) - (b.scoreMaxProduto ?? -1),
      render: (v: number | null) => (
        <Flex gap={8} align="center">
          <NivelInteresseIcon nivel={nivelDoScore(v)} />
          <span>{v ?? '—'}</span>
        </Flex>
      ),
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
      <Title level={2} style={{ margin: 0 }} id="admin-usuarios-title">
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
        <Select
          id="admin-usuarios-nivel"
          allowClear
          placeholder="Nível de interesse"
          style={{ minWidth: 200 }}
          value={nivel}
          options={Object.entries(NIVEIS_INTERESSE).map(([value, n]) => ({
            value,
            label: n.label,
          }))}
          onChange={(v: NivelInteresse | null | undefined) => atualizarUrl({ nivel: v ?? null })}
        />
      </Flex>
      <Table
        size="small"
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{ pageSize: 20 }}
        onChange={(_, filters) => {
          setTipoColuna((filters.tipo as string[] | null | undefined) ?? null)
          const ativo = (filters.ativo as boolean[] | null | undefined) ?? null
          if (JSON.stringify(ativo) !== JSON.stringify(statusFiltro)) atualizarUrl({ status: ativo })
        }}
      />
    </Flex>
  )
}
