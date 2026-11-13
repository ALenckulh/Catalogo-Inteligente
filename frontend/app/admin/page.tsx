'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EyeOutlined } from '@ant-design/icons'
import { getDashboard } from '@/lib/api/admin'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { AdminDashboard } from '@/lib/types'
import {
  Button,
  Card,
  Col,
  Flex,
  Row,
  Spin,
  Statistic,
  Typography,
} from '@/components/ui'
import { DashboardCharts } from './_components/DashboardCharts'
import { HelpTitle } from './_components/HelpTitle'

const { Title } = Typography

type KpiKey = keyof AdminDashboard['kpis']

const KPIS: { key: KpiKey; label: string; help: string; ver?: { href: string; id: string } }[] = [
  {
    key: 'usuariosAtivos',
    label: 'Usuários ativos',
    help: 'Clientes (pessoas ou empresas) com cadastro ativo no catálogo. Não conta administradores nem contas excluídas a pedido do cliente.',
    ver: { href: '/admin/usuarios', id: 'admin-dash-ver-usuarios' },
  },
  {
    key: 'produtosAtivos',
    label: 'Produtos ativos',
    help: 'Produtos que aparecem agora na vitrine para os clientes. Produtos desativados não entram na conta.',
    ver: { href: '/admin/produtos', id: 'admin-dash-ver-produtos' },
  },
  {
    key: 'contatos7d',
    label: 'Contatos (7 dias)',
    help: 'Quantas vezes alguém clicou no botão do WhatsApp para falar com você nos últimos 7 dias. Conta clientes cadastrados e visitantes.',
  },
  {
    key: 'leadsScoreAlto',
    label: 'Clientes com alto interesse',
    help: 'Clientes com nota de interesse 70 ou mais em algum produto, os mesmos da faixa “Quente” do gráfico abaixo. São os melhores candidatos para um contato comercial.',
    ver: { href: '/admin/usuarios?nivel=QUENTE&status=ativo', id: 'admin-dash-ver-alto-interesse' },
  },
]

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
      <Title level={2} id="admin-dash-title" style={{ margin: 0 }}>
        Dashboard
      </Title>
      <Card size="small" title="Indicadores">
        <Row gutter={[16, 16]}>
          {KPIS.map((kpi) => (
            <Col key={kpi.key} xs={12} md={6}>
              <Statistic
                title={<HelpTitle label={kpi.label} help={kpi.help} />}
                value={data.kpis[kpi.key]}
                suffix={
                  kpi.ver && (
                    <Link href={kpi.ver.href}>
                      <Button variant="link" size="small" icon={<EyeOutlined />} id={kpi.ver.id}>
                        Ver
                      </Button>
                    </Link>
                  )
                }
              />
            </Col>
          ))}
        </Row>
      </Card>
      <DashboardCharts series={data.series} />
    </Flex>
  )
}
