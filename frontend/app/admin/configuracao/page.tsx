'use client'

import { useEffect, useState } from 'react'
import { getDecay, getPesos, saveDecay, savePesos } from '@/lib/api/admin'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { ParametroDecay, PesoMetrica } from '@/lib/types'
import {
  Button,
  Flex,
  InputNumber,
  Popconfirm,
  Spin,
  Table,
  Tabs,
  Typography,
  message,
} from '@/components/ui'
import type { TableProps } from '@/components/ui'
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons'

const { Title } = Typography

const DEFAULT_PESOS: PesoMetrica[] = [
  { tipoEvento: 'VISUALIZACAO_PRODUTO', peso: 1 },
  { tipoEvento: 'FAVORITAR', peso: 3 },
  { tipoEvento: 'DESFAVORITAR', peso: -1 },
  { tipoEvento: 'CONTATO_WHATSAPP', peso: 5 },
  { tipoEvento: 'PESQUISA', peso: 1.5 },
  { tipoEvento: 'FILTRO_APLICADO', peso: 1 },
  { tipoEvento: 'SCROLL_DEPTH', peso: 0.5 },
  { tipoEvento: 'TEMPO_PAGINA', peso: 0.8 },
]

export default function AdminConfiguracaoPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const { contextHolder } = useAppNotification()
  const [pesos, setPesos] = useState<PesoMetrica[]>([])
  const [decay, setDecay] = useState<ParametroDecay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) return
    const t = window.setTimeout(() => {
      void Promise.all([getPesos(), getDecay()])
        .then(([p, d]) => {
          setPesos(p)
          setDecay(d)
        })
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(t)
  }, [isAdmin])

  if (authLoading || !isAdmin || loading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        {contextHolder}
        <Spin />
      </Flex>
    )
  }

  const pesoCols: TableProps<PesoMetrica>['columns'] = [
    {
      title: 'Métrica',
      dataIndex: 'tipoEvento',
      sorter: (a, b) => a.tipoEvento.localeCompare(b.tipoEvento),
    },
    {
      title: 'Peso',
      dataIndex: 'peso',
      sorter: (a, b) => a.peso - b.peso,
      render: (peso, row) => (
        <InputNumber
          min={0}
          step={0.1}
          value={peso}
          id={`admin-peso-${row.tipoEvento}`}
          onChange={(v) => {
            setPesos((prev) =>
              prev.map((p) =>
                p.tipoEvento === row.tipoEvento ? { ...p, peso: Number(v ?? 0) } : p,
              ),
            )
          }}
        />
      ),
    },
  ]

  const decayCols: TableProps<ParametroDecay>['columns'] = [
    {
      title: 'Escopo',
      key: 'escopo',
      render: (_, row) => row.categoriaNome ?? 'Global',
      sorter: (a, b) => (a.categoriaNome ?? '').localeCompare(b.categoriaNome ?? ''),
    },
    {
      title: 'λ (lambda)',
      dataIndex: 'lambda',
      sorter: (a, b) => a.lambda - b.lambda,
      render: (lambda, row, index) => (
        <InputNumber
          min={0}
          step={0.01}
          value={lambda}
          id={`admin-decay-lambda-${index}`}
          onChange={(v) => {
            setDecay((prev) =>
              prev.map((d, i) => (i === index ? { ...d, lambda: Number(v ?? 0) } : d)),
            )
          }}
        />
      ),
    },
    {
      title: 'Boost conversão',
      dataIndex: 'boostConversao',
      sorter: (a, b) => a.boostConversao - b.boostConversao,
      render: (boost, row, index) => (
        <InputNumber
          min={0}
          step={0.05}
          value={boost}
          id={`admin-decay-boost-${index}`}
          onChange={(v) => {
            setDecay((prev) =>
              prev.map((d, i) =>
                i === index ? { ...d, boostConversao: Number(v ?? 0) } : d,
              ),
            )
          }}
        />
      ),
    },
  ]

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <Title level={3} style={{ margin: 0 }} id="admin-config-title">
        Configuração de scoring
      </Title>
      <Tabs
        items={[
          {
            key: 'pesos',
            label: 'Pesos de métricas',
            children: (
              <Flex vertical gap={12}>
                <Table
                  size="small"
                  rowKey="tipoEvento"
                  columns={pesoCols}
                  dataSource={pesos}
                  pagination={false}
                />
                <Flex gap="small">
                  <Button
                    id="admin-pesos-salvar"
                    color="primary"
                    icon={<SaveOutlined />}
                    onClick={() => {
                      void savePesos(pesos).then(() => message.success('Pesos salvos'))
                    }}
                  >
                    Salvar
                  </Button>
                  <Popconfirm
                    title="Restaurar pesos padrão?"
                    description="Os valores atuais serão substituídos pelos defaults."
                    okText="Restaurar"
                    cancelText="Cancelar"
                    onConfirm={() => setPesos(DEFAULT_PESOS)}
                  >
                    <Button
                      variant="outlined"
                      id="admin-pesos-reset"
                      icon={<ReloadOutlined />}
                    >
                      Reset defaults
                    </Button>
                  </Popconfirm>
                </Flex>
              </Flex>
            ),
          },
          {
            key: 'decay',
            label: 'Decaimento (λ e boost)',
            children: (
              <Flex vertical gap={12}>
                <Table
                  size="small"
                  rowKey={(r) => String(r.categoriaId ?? 'global')}
                  columns={decayCols}
                  dataSource={decay}
                  pagination={false}
                />
                <Button
                  id="admin-decay-salvar"
                  color="primary"
                  icon={<SaveOutlined />}
                  onClick={() => {
                    void saveDecay(decay).then(() => message.success('Decaimento salvo'))
                  }}
                >
                  Salvar
                </Button>
              </Flex>
            ),
          },
        ]}
      />
    </Flex>
  )
}
