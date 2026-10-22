'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getDashboard } from '@/lib/api/admin'
import { formatDateTime } from '@/lib/formatters'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { AdminDashboard } from '@/lib/types'
import {
  Col,
  Empty,
  Flex,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from '@/components/ui'
import type { TableProps } from '@/components/ui'

const { Title } = Typography

export default function AdminDashboardPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) return
    const t = window.setTimeout(() => {
      void getDashboard()
        .then(setData)
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(t)
  }, [isAdmin])

  if (authLoading || !isAdmin || loading || !data) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    )
  }

  const columns: TableProps<(typeof data.leads)[number]>['columns'] = [
    {
      title: 'Lead',
      dataIndex: 'nome',
      sorter: (a, b) => a.nome.localeCompare(b.nome),
      render: (nome, row) => <Link href={`/admin/usuarios/${row.usuarioId}`}>{nome}</Link>,
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
      title: 'Score máx.',
      dataIndex: 'scoreMaxProduto',
      sorter: (a, b) => a.scoreMaxProduto - b.scoreMaxProduto,
    },
    {
      title: 'Top categoria',
      dataIndex: 'topCategoria',
      sorter: (a, b) => (a.topCategoria ?? '').localeCompare(b.topCategoria ?? ''),
    },
    {
      title: 'Última atividade',
      dataIndex: 'ultimaAtividade',
      sorter: (a, b) => a.ultimaAtividade.localeCompare(b.ultimaAtividade),
      render: (d) => formatDateTime(d),
    },
  ]

  return (
    <Flex vertical gap={24}>
      <Title level={3} id="admin-dash-title" style={{ margin: 0 }}>
        Dashboard
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Statistic title="Usuários ativos" value={data.kpis.usuariosAtivos} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Produtos ativos" value={data.kpis.produtosAtivos} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Contatos (7d)" value={data.kpis.contatos7d} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Leads score alto" value={data.kpis.leadsScoreAlto} />
        </Col>
      </Row>
      <Title level={4} style={{ margin: 0 }}>
        Leads priorizados
      </Title>
      <Table
        size="small"
        rowKey="usuarioId"
        columns={columns}
        dataSource={data.leads}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description="Nenhum lead com score ainda" /> }}
      />
    </Flex>
  )
}
