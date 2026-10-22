'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduto, updateProduto } from '@/lib/api/admin'
import { listCategorias } from '@/lib/api/categorias'
import { toApiError } from '@/lib/api/client'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import type { Categoria, Produto, ProdutoInput } from '@/lib/types'
import {
  Alert,
  Button,
  Flex,
  Form,
  FormItem,
  Input,
  InputNumber,
  Select,
  Switch,
} from '@/components/ui'

interface Props {
  initial?: Produto
}

function slugify(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function ProdutoForm({ initial }: Props) {
  const router = useRouter()
  const { api, contextHolder } = useAppNotification()
  const [form] = Form.useForm()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))

  useEffect(() => {
    const t = window.setTimeout(() => {
      void listCategorias().then(setCategorias)
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!initial) return
    form.setFieldsValue({
      nome: initial.nome,
      slug: initial.slug,
      descricao: initial.descricao ?? '',
      preco: initial.preco,
      categoriaId: initial.categoriaId,
      ativo: initial.ativo,
    })
  }, [initial, form])

  async function onFinish(values: {
    nome: string
    slug: string
    descricao?: string
    preco: number
    categoriaId: number
    ativo: boolean
  }) {
    setError(null)
    setSubmitting(true)
    const body: ProdutoInput = {
      nome: values.nome,
      slug: values.slug,
      descricao: values.descricao,
      preco: values.preco,
      categoriaId: values.categoriaId,
      ativo: values.ativo,
    }
    try {
      if (initial) {
        await updateProduto(initial.id, body)
        api.success({ message: 'Produto atualizado' })
      } else {
        await createProduto(body)
        api.success({ message: 'Produto criado' })
      }
      router.push('/admin/produtos')
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Flex vertical gap={16} style={{ maxWidth: 560 }}>
      {contextHolder}
      {error && <Alert type="error" showIcon message={error} />}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ ativo: true }}
        requiredMark={false}
      >
        <FormItem
          name="nome"
          label="Nome"
          tooltip="Nome exibido no catálogo"
          rules={[{ required: true, message: 'Informe o nome' }]}
        >
          <Input
            id="admin-prod-form-nome"
            placeholder="Informe o nome"
            onChange={(e) => {
              if (!slugTouched) {
                form.setFieldValue('slug', slugify(e.target.value))
              }
            }}
          />
        </FormItem>
        <FormItem
          name="slug"
          label="Slug"
          tooltip="URL amigável (único)"
          rules={[{ required: true, message: 'Informe o slug' }]}
        >
          <Input
            id="admin-prod-form-slug"
            placeholder="Informe o slug"
            onChange={() => setSlugTouched(true)}
          />
        </FormItem>
        <FormItem name="descricao" label="Descrição" tooltip="Texto livre da ficha">
          <Input.TextArea id="admin-prod-form-desc" placeholder="Informe a descrição" rows={3} />
        </FormItem>
        <FormItem
          name="preco"
          label="Preço"
          tooltip="Preço de referência (≥ 0)"
          rules={[{ required: true, message: 'Informe o preço' }]}
        >
          <InputNumber
            id="admin-prod-form-preco"
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            placeholder="R$ 0,00"
          />
        </FormItem>
        <FormItem
          name="categoriaId"
          label="Categoria"
          tooltip="Categoria do produto"
          rules={[{ required: true, message: 'Selecione a categoria' }]}
        >
          <Select
            id="admin-prod-form-cat"
            placeholder="Selecione a categoria"
            options={categorias.map((c) => ({ value: c.id, label: c.nome }))}
          />
        </FormItem>
        <FormItem
          name="ativo"
          label="Ativo"
          tooltip="Visível no catálogo público"
          valuePropName="checked"
        >
          <Switch id="admin-prod-form-ativo" />
        </FormItem>
        <Flex gap="small">
          <Button
            id="admin-prod-form-salvar"
            color="primary"
            htmlType="submit"
            loading={submitting}
          >
            Salvar
          </Button>
          <Button id="admin-prod-form-cancelar" onClick={() => router.push('/admin/produtos')}>
            Cancelar
          </Button>
        </Flex>
      </Form>
    </Flex>
  )
}
