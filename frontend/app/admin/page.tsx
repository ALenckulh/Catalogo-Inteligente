'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EyeOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { getDashboard } from '@/lib/api/admin'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { AdminDashboard } from '@/lib/types'
import {
  Button,
  Col,
  Flex,
  Row,
  Space,
  Spin,
  Statistic,
  Tooltip,
  Typography,
} from '@/components/ui'
import { DashboardCharts } from './_components/DashboardCharts'

const { Title } = Typography

const KPI_HELP = {
  usuariosAtivos:
    'Contagem de contas PF/PJ com deleted_at nulo (não excluídas/anonimizadas LGPD). Exclui ADMIN.',
  produtosAtivos:
    'Contagem de produtos com ativo = true (visíveis na vitrine).',
  contatos7d: 'Eventos CONTATO_WHATSAPP nos últimos 7 dias.',
  leadsScoreAlto:
    'Usuários cujo score_produto máximo é ≥ 70.',
} as const

function KpiTitle({ label, help }: { label: string; help: string }) {
  return (
    <Space size={4}>
      <span>{label}</span>
      <Tooltip title={help}>
        <InfoCircleOutlined aria-label={`Ajuda: ${label}`} />
      </Tooltip>
    </Space>
  )
}

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

  return (
    <Flex vertical gap={24}>
      <Title level={3} id="admin-dash-title" style={{ margin: 0 }}>
        Dashboard
      </Title>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Flex vertical gap={8}>
            <Statistic
              title={
                <KpiTitle label="Usuários ativos" help={KPI_HELP.usuariosAtivos} />
              }
              value={data.kpis.usuariosAtivos}
            />
            <Link href="/admin/usuarios">
              <Button
                variant="link"
                size="small"
                icon={<EyeOutlined />}
                id="admin-dash-ver-usuarios"
              >
                Ver
              </Button>
            </Link>
          </Flex>
        </Col>
        <Col xs={12} md={6}>
          <Flex vertical gap={8}>
            <Statistic
              title={
                <KpiTitle label="Produtos ativos" help={KPI_HELP.produtosAtivos} />
              }
              value={data.kpis.produtosAtivos}
            />
            <Link href="/admin/produtos">
              <Button
                variant="link"
                size="small"
                icon={<EyeOutlined />}
                id="admin-dash-ver-produtos"
              >
                Ver
              </Button>
            </Link>
          </Flex>
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title={<KpiTitle label="Contatos (7d)" help={KPI_HELP.contatos7d} />}
            value={data.kpis.contatos7d}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title={
              <KpiTitle label="Leads score alto" help={KPI_HELP.leadsScoreAlto} />
            }
            value={data.kpis.leadsScoreAlto}
          />
        </Col>
      </Row>
      <DashboardCharts series={data.series} />
    </Flex>
  )
}
