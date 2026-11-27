'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { listAdminUsuarios } from '@/lib/api/admin'
import { listCategorias } from '@/lib/api/categorias'
import { formatTelefone } from '@/lib/formatters'
import { telefoneForMask } from '@/lib/validators'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import { useTabelaPaginada } from '@/lib/hooks/useTabelaPaginada'
import type { AdminUsuarioListItem, Categoria } from '@/lib/types'
import { NIVEIS_INTERESSE, isNivelInteresse, type NivelInteresse } from '@/lib/nivelInteresse'
import { PageError } from '@/components/layout/PageStates'
import { AtivoTag, DataCelula, NaoCompartilhado, NotaCelula, TextoCelula } from '@/components/admin/celulas'
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
import { HelpTitle } from '../../_components/HelpTitle'

const { Title } = Typography

const TIPOS = ['PF', 'PJ'] as const

/** O contato já ocupa duas linhas (e-mail e telefone): os outros textos podem usar as mesmas duas. */
const duasLinhas = (v: string | null | undefined, row: AdminUsuarioListItem) =>
  row.interesseVisivel ? <TextoCelula texto={v} linhas={2} /> : <NaoCompartilhado />

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

  const tipoUrl = searchParams.get('tipo')
  const tipo = TIPOS.find((t) => t === tipoUrl)
  const categoria = searchParams.get('categoria') ?? undefined

  /**
   * Filtros na URL, para o link poder ser compartilhado (ex.: o do dashboard) e voltar do detalhe não perdê-los.
   * A busca fica de fora: pode ter CPF ou telefone, e a URL vai para o histórico e para os logs.
   */
  function atualizarUrl(next: Partial<Record<'nivel' | 'status' | 'tipo' | 'categoria', string | null>>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [chave, valor] of Object.entries(next)) {
      if (valor) params.set(chave, valor)
      else params.delete(chave)
    }
    const qs = params.toString()
    router.replace(qs ? `/admin/usuarios?${qs}` : '/admin/usuarios', { scroll: false })
  }
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [q, setQ] = useState('')

  const buscar = useCallback(
    (params: { page: number; limit: number; sort?: string }) =>
      listAdminUsuarios({ q: q || undefined, tipo, categoria, nivel, ativo, ...params }),
    [q, tipo, categoria, nivel, ativo],
  )
  const { items, loading, erro, setPage, reload, onTableChange, sortOrder, pagination } =
    useTabelaPaginada<AdminUsuarioListItem>(buscar, isAdmin)

  useEffect(() => {
    if (!isAdmin) return
    void listCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]))
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
      width: '15%',
      render: (_, row) => <TextoCelula texto={row.nomeCompleto ?? row.razaoSocial} linhas={2} principal />,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      width: 68,
      filters: [
        { text: 'PF', value: 'PF' },
        { text: 'PJ', value: 'PJ' },
      ],
      filterMultiple: false,
      filteredValue: tipo ? [tipo] : null,
      render: (t) => <Tag>{t}</Tag>,
    },
    {
      title: 'Contato',
      dataIndex: 'email',
      sorter: true,
      sortOrder: sortOrder('email'),
      width: '19%',
      render: (email: string | null, row) =>
        row.contatoVisivel ? (
          <>
            <TextoCelula texto={email} />
            {row.telefone && <TextoCelula texto={formatTelefone(telefoneForMask(row.telefone))} type="secondary" />}
          </>
        ) : (
          <NaoCompartilhado />
        ),
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      width: 86,
      filters: [
        { text: 'Ativo', value: true },
        { text: 'Inativo', value: false },
      ],
      filterMultiple: false,
      filteredValue: ativo === undefined ? null : [ativo],
      render: (valor: boolean) => <AtivoTag ativo={valor} />,
    },
    {
      title: 'Score máx.',
      dataIndex: 'scoreMaxProduto',
      width: 84,
      sorter: true,
      sortOrder: sortOrder('scoreMaxProduto'),
      render: (v: number | null, row) => (row.interesseVisivel ? <NotaCelula nota={v} /> : <NaoCompartilhado />),
    },
    {
      title: 'Top categoria',
      dataIndex: 'topCategoria',
      sorter: true,
      sortOrder: sortOrder('topCategoria'),
      render: duasLinhas,
    },
    {
      title: (
        <HelpTitle
          label="Próxima compra provável"
          help="Produto de maior nota que o cliente não comprou nos últimos 30 dias."
        />
      ),
      dataIndex: 'proximaCompra',
      // Uma fatia do total, e não a sobra: é o texto mais longo e o cabeçalho precisa de duas linhas inteiras.
      width: '15%',
      render: duasLinhas,
    },
    {
      title: 'Última atividade',
      dataIndex: 'ultimaAtividade',
      sorter: true,
      sortOrder: sortOrder('ultimaAtividade'),
      width: 96,
      render: (d: string | null, row) => (row.interesseVisivel ? <DataCelula data={d} /> : <NaoCompartilhado />),
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 62,
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
            atualizarUrl({ tipo: v ?? null })
            setPage(1)
          }}
        />
        <Select
          id="admin-usuarios-categoria"
          allowClear
          placeholder="Selecione a categoria"
          style={{ minWidth: 180 }}
          value={categoria}
          options={categorias.map((c) => ({ value: c.nome, label: c.nome }))}
          onChange={(v: string | null | undefined) => {
            atualizarUrl({ categoria: v ?? null })
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
      {erro ? (
        <PageError onRetry={() => void reload()} />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          pagination={pagination}
          scroll={{ x: 970 }}
          onChange={(p, filters, sorter) => {
            const tipoFiltro = filters.tipo?.[0] as string | undefined
            const ativoFiltro = filters.ativo?.[0] as boolean | undefined
            const mudou = tipoFiltro !== tipo || ativoFiltro !== ativo
            if (mudou) {
              const status = ativoFiltro === undefined ? null : ativoFiltro ? 'ativo' : 'inativo'
              atualizarUrl({ tipo: tipoFiltro ?? null, status })
            }
            onTableChange(p, sorter, mudou)
          }}
        />
      )}
    </Flex>
  )
}
