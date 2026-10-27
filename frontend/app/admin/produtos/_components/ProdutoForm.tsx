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
  Typography,
} from '@/components/ui'
import {
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons'

const { Title } = Typography

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

function fichaToPairs(ficha: Record<string, string> | null | undefined) {
  if (!ficha) return []
  return Object.entries(ficha).map(([chave, valor]) => ({ chave, valor }))
}

function pairsToFicha(
  pairs: Array<{ chave?: string; valor?: string }> | undefined,
): Record<string, string> | undefined {
  if (!pairs?.length) return undefined
  const out: Record<string, string> = {}
  for (const row of pairs) {
    const k = row.chave?.trim()
    if (!k) continue
    out[k] = row.valor?.trim() ?? ''
  }
  return Object.keys(out).length ? out : undefined
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
      fichaPairs: fichaToPairs(initial.fichaTecnica),
      imagens: [...initial.imagens]
        .sort((a, b) => a.ordem - b.ordem)
        .map((img) => ({
          url: img.url,
          altText: img.altText ?? '',
          ordem: img.ordem,
        })),
    })
  }, [initial, form])

  async function onFinish(values: {
    nome: string
    slug: string
    descricao?: string
    preco: number
    categoriaId: number
    ativo: boolean
    fichaPairs?: Array<{ chave?: string; valor?: string }>
    imagens?: Array<{ url?: string; altText?: string; ordem?: number }>
  }) {
    setError(null)
    setSubmitting(true)
    const imagens = (values.imagens ?? [])
      .filter((img) => img.url?.trim())
      .map((img, i) => ({
        url: String(img.url).trim(),
        altText: img.altText?.trim() || null,
        ordem: img.ordem ?? i,
      }))
    const body: ProdutoInput = {
      nome: values.nome,
      slug: values.slug,
      descricao: values.descricao,
      preco: values.preco,
      categoriaId: values.categoriaId,
      ativo: values.ativo,
      fichaTecnica: pairsToFicha(values.fichaPairs),
      imagens,
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
    <Flex vertical gap={16} style={{ maxWidth: 640 }}>
      {contextHolder}
      {error && <Alert type="error" showIcon title={error} />}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ ativo: true, fichaPairs: [], imagens: [] }}
        requiredMark={false}
      >
        <Title level={5} style={{ marginTop: 0 }}>
          Dados
        </Title>
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

        <Title level={5}>Ficha técnica</Title>
        <Form.List name="fichaPairs">
          {(fields, { add, remove }) => (
            <Flex vertical gap="small">
              {fields.map((field) => (
                <Flex key={field.key} gap="small" align="flex-start">
                  <FormItem
                    {...field}
                    name={[field.name, 'chave']}
                    style={{ flex: 1, marginBottom: 0 }}
                    rules={[{ required: true, message: 'Chave' }]}
                  >
                    <Input placeholder="Chave" id={`admin-prod-ficha-chave-${field.key}`} />
                  </FormItem>
                  <FormItem
                    {...field}
                    name={[field.name, 'valor']}
                    style={{ flex: 1, marginBottom: 0 }}
                    rules={[{ required: true, message: 'Valor' }]}
                  >
                    <Input placeholder="Valor" id={`admin-prod-ficha-valor-${field.key}`} />
                  </FormItem>
                  <Button
                    variant="text"
                    icon={<DeleteOutlined />}
                    tooltip="Remover"
                    onClick={() => remove(field.name)}
                    id={`admin-prod-ficha-rm-${field.key}`}
                  />
                </Flex>
              ))}
              <Button
                variant="dashed"
                icon={<PlusOutlined />}
                onClick={() => add()}
                id="admin-prod-ficha-add"
                block
              >
                Adicionar atributo
              </Button>
            </Flex>
          )}
        </Form.List>

        <Title level={5} style={{ marginTop: 24 }}>
          Imagens
        </Title>
        <Form.List name="imagens">
          {(fields, { add, remove }) => (
            <Flex vertical gap="small">
              {fields.map((field) => (
                <Flex key={field.key} vertical gap={4} style={{ marginBottom: 8 }}>
                  <Flex gap="small" align="flex-start">
                    <FormItem
                      {...field}
                      name={[field.name, 'url']}
                      style={{ flex: 1, marginBottom: 0 }}
                      rules={[{ required: true, message: 'URL' }]}
                    >
                      <Input placeholder="URL" id={`admin-prod-img-url-${field.key}`} />
                    </FormItem>
                    <FormItem
                      {...field}
                      name={[field.name, 'ordem']}
                      style={{ width: 88, marginBottom: 0 }}
                      rules={[{ required: true, message: 'Ordem' }]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Ordem"
                        style={{ width: '100%' }}
                        id={`admin-prod-img-ordem-${field.key}`}
                      />
                    </FormItem>
                    <Button
                      variant="text"
                      icon={<DeleteOutlined />}
                      tooltip="Remover"
                      onClick={() => remove(field.name)}
                      id={`admin-prod-img-rm-${field.key}`}
                    />
                  </Flex>
                  <FormItem
                    {...field}
                    name={[field.name, 'altText']}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="Texto alternativo" id={`admin-prod-img-alt-${field.key}`} />
                  </FormItem>
                </Flex>
              ))}
              <Button
                variant="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ ordem: fields.length, url: '', altText: '' })}
                id="admin-prod-img-add"
                block
              >
                Adicionar imagem
              </Button>
            </Flex>
          )}
        </Form.List>

        <Flex gap="small" style={{ marginTop: 24 }}>
          <Button
            id="admin-prod-form-salvar"
            color="primary"
            htmlType="submit"
            loading={submitting}
            icon={<SaveOutlined />}
          >
            Salvar
          </Button>
          <Button
            variant="outlined"
            id="admin-prod-form-cancelar"
            icon={<CloseOutlined />}
            onClick={() => router.push('/admin/produtos')}
          >
            Cancelar
          </Button>
        </Flex>
      </Form>
    </Flex>
  )
}
