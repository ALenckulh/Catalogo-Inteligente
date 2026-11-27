'use client'

import { useCallback, useState } from 'react'
import dayjs from 'dayjs'
import { createCompra, listAdminProdutos, updateCompra } from '@/lib/api/admin'
import { toApiError } from '@/lib/api/client'
import { precoInputProps, toMoneyBRL } from '@/lib/formatters'
import type { Compra } from '@/lib/types'
import {
  Alert,
  Col,
  DatePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Typography,
  useForm,
  useWatch,
} from '@/components/ui'

const { Text } = Typography

interface Valores {
  produtoId: number
  precoUnitario: number
  quantidade: number
  data: dayjs.Dayjs
  observacoes?: string
}

interface Props {
  open: boolean
  usuarioId: number
  /** Presente = edição; ausente = novo registro. */
  compra?: Compra
  onClose: () => void
  onSaved: (mensagem: string) => void
}

export function CompraModal({ open, usuarioId, compra, onClose, onSaved }: Props) {
  const [form] = useForm<Valores>()
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const preco = useWatch('precoUnitario', form)
  const qtd = useWatch('quantidade', form)
  const total = preco && qtd ? Math.round(preco * qtd * 100) / 100 : null

  const buscarProdutos = useCallback(
    async ({ page, pageSize, search }: { page: number; pageSize: number; search: string }) => {
      try {
        // Página do Select começa em 0; a da API do front, em 1.
        const res = await listAdminProdutos({ q: search || undefined, page: page + 1, limit: pageSize })
        setErro(null)
        return {
          items: res.items.map((p) => ({ value: p.id, label: p.nome, preco: p.preco })),
          hasMore: (page + 1) * pageSize < res.total,
        }
      } catch (e) {
        setErro(toApiError(e).message)
        return { items: [], hasMore: false }
      }
    },
    [],
  )

  async function onFinish(v: Valores) {
    setErro(null)
    setSalvando(true)
    const body = {
      produtoId: v.produtoId,
      precoUnitario: v.precoUnitario,
      quantidade: v.quantidade,
      data: v.data.format('YYYY-MM-DD'),
      observacoes: v.observacoes?.trim() || null,
    }
    try {
      if (compra) await updateCompra(usuarioId, compra.id, body)
      else await createCompra(usuarioId, body)
      onSaved(compra ? 'Compra atualizada' : 'Compra registrada')
    } catch (e) {
      setErro(toApiError(e).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal
      centered
      destroyOnHidden
      open={open}
      title={compra ? 'Editar compra' : 'Registrar compra'}
      okText={compra ? 'Salvar' : 'Registrar'}
      cancelText="Cancelar"
      confirmLoading={salvando}
      onOk={() => form.submit()}
      onCancel={onClose}
      afterOpenChange={(aberto) => !aberto && setErro(null)}
    >
      {erro && <Alert type="error" showIcon title={erro} style={{ marginBottom: 'var(--space-4)' }} />}
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        preserve={false}
        onFinish={onFinish}
        initialValues={
          compra
            ? { ...compra, data: dayjs(compra.data), observacoes: compra.observacoes ?? undefined }
            : { quantidade: 1, data: dayjs() }
        }
      >
        <FormItem
          name="produtoId"
          label="Produto"
          tooltip="Produto adquirido pelo cliente"
          rules={[{ required: true, message: 'Selecione o produto' }]}
        >
          <Select.Pageable
            id="admin-compra-produto"
            placeholder="Selecione o produto"
            fetchPage={buscarProdutos}
            // Na edição, o produto da compra pode não estar entre as opções carregadas: mostra o nome, não o id.
            labelRender={({ label, value }) =>
              label ?? (value === compra?.produtoId ? compra?.produtoNome : null) ?? `Produto ${value}`
            }
            onChange={(_, opcao) => {
              const preco = Array.isArray(opcao) ? undefined : opcao?.preco
              if (form.getFieldValue('precoUnitario') == null) form.setFieldValue('precoUnitario', preco)
            }}
          />
        </FormItem>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <FormItem
              name="precoUnitario"
              label="Preço unitário"
              tooltip="Valor unitário negociado; começa com o preço de catálogo"
              rules={[{ required: true, message: 'Informe o preço unitário' }]}
            >
              <InputNumber
                id="admin-compra-preco"
                min={0.01}
                max={9999999999.99}
                step={0.01}
                precision={2}
                {...precoInputProps()}
                prefix="R$"
                placeholder="0,00"
                style={{ width: '100%' }}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12}>
            <FormItem
              name="quantidade"
              label="Quantidade"
              tooltip="Quantidade de unidades adquiridas"
              rules={[{ required: true, message: 'Informe a quantidade' }]}
            >
              <InputNumber id="admin-compra-qtd" min={1} precision={0} placeholder="Informe a quantidade" style={{ width: '100%' }} />
            </FormItem>
          </Col>
          <Col xs={24} sm={12}>
            <FormItem
              name="data"
              label="Data"
              tooltip="Data em que a compra aconteceu"
              rules={[{ required: true, message: 'Selecione a data da compra' }]}
            >
              <DatePicker
                id="admin-compra-data"
                format="DD/MM/YYYY"
                placeholder="Selecione a data da compra"
                disabledDate={(d) => d.isAfter(dayjs(), 'day')}
                style={{ width: '100%' }}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12}>
            <FormItem label="Total" tooltip="Calculado: preço unitário × quantidade">
              <Text strong id="admin-compra-total">{toMoneyBRL(total)}</Text>
            </FormItem>
          </Col>
        </Row>
        <FormItem name="observacoes" label="Observações (opcional)" tooltip="Anotação interna sobre a compra" style={{ marginBottom: 0 }}>
          <Input.TextArea id="admin-compra-obs" placeholder="Informe as observações" rows={2} maxLength={500} />
        </FormItem>
      </Form>
    </Modal>
  )
}
