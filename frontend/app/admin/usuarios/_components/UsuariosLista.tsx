'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { listAdminUsuarios } from '@/lib/api/admin'
import { listCategorias } from '@/lib/api/categorias'
import { formatDateTime } from '@/lib/formatters'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import { useTabelaPaginada } from '@/lib/hooks/useTabelaPaginada'
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

function statusDaUrl(v: string | null): boolean | undefined {
  if (v === 'ativo') return true
  if (v === 'inativo') return false
  return undefined
}

export function UsuariosLista() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nivelUrl = searchParams.get('nivel')
  const nivel: NivelInteresse | undefined = isNivelInteresse(nivelUrl) ? nivelUrl : undefined
  const ativo = statusDaUrl(searchParams.get('status'))

  /** Mantém `nivel` e `status` na URL para que o filtro possa ser compartilhado (ex.: link do dashboard). */
  function atualizarUrl(next: { nivel?: NivelInteresse | null; ativo?: boolean | null }) {
    const params = new URLSearchParams(searchParams.toString())
    if (next.nivel !== undefined) {
      if (next.nivel) params.set('nivel', next.nivel)
      else params.delete('nivel')
    }
    if (next.ativo !== undefined) {
      if (next.ativo === null) params.delete('status')
      else params.set('status', next.ativo ? 'ativo' : 'inativo')
    }
    const qs = params.toString()
    router.replace(qs ? `/admin/usuarios?${qs}` : '/admin/usuarios', { scroll: false })
  }
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [q, setQ] = useState('')
  /** Um estado só para o Select de tipo e o filtro da coluna Tipo. */
  const [tipo, setTipo] = useState<string | undefined>()
  const [categoria, setCategoria] = useState<string | undefined>()

  const buscar = useCallback(
    (params: { page: number; limit: number; sort?: string }) =>
      listAdminUsuarios({ q: q || undefined, tipo, categoria, nivel, ativo, ...params }),
    [q, tipo, categoria, nivel, ativo],
  )
  const { items, loading, setPage, onTableChange, sortOrder, pagination } =
    useTabelaPaginada<AdminUsuarioListItem>(buscar, isAdmin)

  useEffect(() => {
    if (!isAdmin) return
    void listCategorias().then(setCategorias)
  }, [isAdmin])

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
      dataIndex: 'nome',
      sorter: true,
      sortOrder: sortOrder('nome'),
      render: (_, row) => row.nomeCompleto ?? row.razaoSocial ?? '—',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      filters: [
        { text: 'PF', value: 'PF' },
        { text: 'PJ', value: 'PJ' },
      ],
      filterMultiple: false,
      filteredValue: tipo ? [tipo] : null,
      render: (t) => <Tag>{t}</Tag>,
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      sorter: true,
      sortOrder: sortOrder('email'),
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
      filterMultiple: false,
      filteredValue: ativo === undefined ? null : [ativo],
      render: (valor: boolean) => (
        <Tag color={valor ? 'success' : 'default'}>{valor ? 'Ativo' : 'Inativo'}</Tag>
      ),
    },
    {
      title: 'Score máx.',
      dataIndex: 'scoreMaxProduto',
      sorter: true,
      sortOrder: sortOrder('scoreMaxProduto'),
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
      sorter: true,
      sortOrder: sortOrder('topCategoria'),
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Última atividade',
      dataIndex: 'ultimaAtividade',
      sorter: true,
      sortOrder: sortOrder('ultimaAtividade'),
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
          placeholder="Nome, e-mail, CPF/CNPJ ou telefone"
          allowClear
          style={{ maxWidth: 280 }}
          onSearch={(v) => {
            setQ(v)
            setPage(1)
          }}
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
          value={tipo}
          onChange={(v: string | null | undefined) => {
            setTipo(v ?? undefined)
            setPage(1)
          }}
        />
        <Select
          id="admin-usuarios-categoria"
          allowClear
          placeholder="Selecione a categoria"
          style={{ minWidth: 180 }}
          options={categorias.map((c) => ({ value: c.nome, label: c.nome }))}
          onChange={(v: string | null | undefined) => {
            setCategoria(v ?? undefined)
            setPage(1)
          }}
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
          onChange={(v: NivelInteresse | null | undefined) => {
            atualizarUrl({ nivel: v ?? null })
            setPage(1)
          }}
        />
      </Flex>
      <Table
        size="small"
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={pagination}
        onChange={(p, filters, sorter) => {
          const tipoFiltro = filters.tipo?.[0] as string | undefined
          const ativoFiltro = filters.ativo?.[0] as boolean | undefined
          setTipo(tipoFiltro)
          if (ativoFiltro !== ativo) atualizarUrl({ ativo: ativoFiltro ?? null })
          onTableChange(p, sorter, tipoFiltro !== tipo || ativoFiltro !== ativo)
        }}
      />
    </Flex>
  )
}
