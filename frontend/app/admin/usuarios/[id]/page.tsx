'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ShoppingCartOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { createCompra, getAdminUsuario } from '@/lib/api/admin'
import { listProdutos } from '@/lib/api/produtos'
import { whatsappUrl } from '@/lib/config'
import { formatDate, formatTelefone, toMoneyBRL } from '@/lib/formatters'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { AdminUsuarioDetalhe, Produto } from '@/lib/types'
import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Flex,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  Spin,
  Table,
  Tabs,
  Typography,
} from '@/components/ui'
import type { TableProps } from '@/components/ui'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function AdminUsuarioDetalhePage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const { api, contextHolder } = useAppNotification()
  const [data, setData] = useState<AdminUsuarioDetalhe | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [form] = Form.useForm()

  async function reload() {
    setData(await getAdminUsuario(id))
  }

  useEffect(() => {
    if (!isAdmin) return
    const t = window.setTimeout(() => {
      void Promise.all([getAdminUsuario(id), listProdutos({ limit: 50 })])
        .then(([detalhe, prods]) => {
          setData(detalhe)
          setProdutos(prods.items)
        })
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(t)
  }, [isAdmin, id])

  if (authLoading || !isAdmin || loading || !data) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        {contextHolder}
        <Spin />
      </Flex>
    )
  }

  const { usuario } = data
  const nome = usuario.nomeCompleto ?? usuario.razaoSocial ?? usuario.email
  const tel = usuario.telefone

  const scoreCols: TableProps<(typeof data.scoresProduto)[number]>['columns'] = [
    { title: 'Produto', dataIndex: 'produtoNome', sorter: (a, b) => a.produtoNome.localeCompare(b.produtoNome) },
    { title: 'Score', dataIndex: 'valor', sorter: (a, b) => a.valor - b.valor },
  ]

  const catCols: TableProps<(typeof data.scoresCategoria)[number]>['columns'] = [
    { title: 'Categoria', dataIndex: 'categoriaNome', sorter: (a, b) => a.categoriaNome.localeCompare(b.categoriaNome) },
    { title: 'Score', dataIndex: 'valor', sorter: (a, b) => a.valor - b.valor },
  ]

  const compraCols: TableProps<(typeof data.compras)[number]>['columns'] = [
    { title: 'Produto', dataIndex: 'produtoNome', sorter: (a, b) => (a.produtoNome ?? '').localeCompare(b.produtoNome ?? '') },
    { title: 'Qtd', dataIndex: 'quantidade', sorter: (a, b) => a.quantidade - b.quantidade },
    {
      title: 'Total',
      dataIndex: 'valorTotal',
      sorter: (a, b) => a.valorTotal - b.valorTotal,
      render: (v: number) => toMoneyBRL(v),
    },
    {
      title: 'Data',
      dataIndex: 'data',
      sorter: (a, b) => a.data.localeCompare(b.data),
      render: (d) => formatDate(d),
    },
  ]

  async function onCompra(values: {
    produtoId: number
    precoUnitario: number
    quantidade: number
    data: dayjs.Dayjs
    observacoes?: string
  }) {
    const valorTotal = values.precoUnitario * values.quantidade
    await createCompra(id, {
      produtoId: values.produtoId,
      precoUnitario: values.precoUnitario,
      quantidade: values.quantidade,
      valorTotal,
      data: values.data.format('YYYY-MM-DD'),
      observacoes: values.observacoes ?? null,
    })
    api.success({ message: 'Compra registrada' })
    form.resetFields()
    await reload()
  }

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <Flex justify="space-between" align="center" wrap="wrap" gap="middle">
        <div>
          <Link href="/admin/usuarios">← Usuários</Link>
          <Title level={3} style={{ margin: '8px 0 0' }} id="admin-user-detail-title">
            {nome}
          </Title>
          <Text type="secondary">{usuario.email}</Text>
        </div>
        <Button
          id="admin-user-whatsapp"
          color="primary"
          icon={<WhatsAppOutlined />}
          disabled={!tel}
          tooltip={!tel ? 'Usuário sem telefone cadastrado' : undefined}
          onClick={() => {
            if (!tel) return
            window.open(whatsappUrl(`Olá ${nome}!`), '_blank', 'noopener,noreferrer')
          }}
        >
          WhatsApp {tel ? formatTelefone(tel) : ''}
        </Button>
      </Flex>

      <Tabs
        items={[
          {
            key: 'scores',
            label: 'Scores',
            children: (
              <Flex vertical gap={16}>
                <Table size="small" rowKey="produtoId" columns={scoreCols} dataSource={data.scoresProduto} pagination={false} />
                <Table size="small" rowKey="categoriaId" columns={catCols} dataSource={data.scoresCategoria} pagination={false} />
              </Flex>
            ),
          },
          {
            key: 'preco',
            label: 'Faixa de preço',
            children: (
              <>
                <Descriptions
                  bordered
                  size="small"
                  column={1}
                  items={[
                    {
                      key: 'com',
                      label: 'Mediana com conversão',
                      children: toMoneyBRL(data.faixaPreco.medianaComConversao),
                    },
                    {
                      key: 'sem',
                      label: 'Mediana sem conversão',
                      children: toMoneyBRL(data.faixaPreco.medianaSemConversao),
                    },
                    {
                      key: 'gap',
                      label: 'Gap de preço',
                      children: toMoneyBRL(data.faixaPreco.gapPreco),
                    },
                  ]}
                />
                {data.faixaPreco.gapPreco > 10 && (
                  <Alert
                    style={{ marginTop: 16 }}
                    type="warning"
                    showIcon
                    title="Gap sugere possível barreira de preço"
                  />
                )}
              </>
            ),
          },
          {
            key: 'compras',
            label: 'Compras',
            children: (
              <Flex vertical gap={16}>
                {data.compras.length < 3 && (
                  <Alert
                    type="info"
                    showIcon
                    title="Menos de 3 compras: peso do histórico de compras = 0 no score."
                  />
                )}
                <Table
                  size="small"
                  rowKey="id"
                  columns={compraCols}
                  dataSource={data.compras}
                  pagination={{ pageSize: 10 }}
                />
                <Title level={5}>Registrar compra</Title>
                <Form form={form} layout="vertical" onFinish={onCompra} requiredMark={false} style={{ maxWidth: 480 }}>
                  <FormItem
                    name="produtoId"
                    label="Produto"
                    tooltip="Produto adquirido"
                    rules={[{ required: true, message: 'Selecione o produto' }]}
                  >
                    <Select
                      id="admin-compra-produto"
                      placeholder="Selecione o produto"
                      options={produtos.map((p) => ({ value: p.id, label: p.nome }))}
                      showSearch
                      optionFilterProp="label"
                    />
                  </FormItem>
                  <FormItem
                    name="precoUnitario"
                    label="Preço unitário"
                    tooltip="Valor unitário negociado"
                    rules={[{ required: true }]}
                  >
                    <InputNumber id="admin-compra-preco" min={0} step={0.01} style={{ width: '100%' }} placeholder="R$ 0,00" />
                  </FormItem>
                  <FormItem
                    name="quantidade"
                    label="Quantidade"
                    tooltip="Quantidade adquirida"
                    rules={[{ required: true }]}
                  >
                    <InputNumber id="admin-compra-qtd" min={1} style={{ width: '100%' }} />
                  </FormItem>
                  <FormItem
                    name="data"
                    label="Data"
                    tooltip="Data da compra"
                    rules={[{ required: true }]}
                  >
                    <DatePicker id="admin-compra-data" style={{ width: '100%' }} placeholder="Selecione a data de compra" />
                  </FormItem>
                  <FormItem name="observacoes" label="Observações" tooltip="Opcional">
                    <Input.TextArea id="admin-compra-obs" placeholder="Informe as observações" rows={2} />
                  </FormItem>
                  <Button
                    id="admin-compra-salvar"
                    color="primary"
                    htmlType="submit"
                    icon={<ShoppingCartOutlined />}
                  >
                    Registrar compra
                  </Button>
                </Form>
              </Flex>
            ),
          },
        ]}
      />
    </Flex>
  )
}
