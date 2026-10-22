'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toApiError } from '@/lib/api/client'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import type { SignupRequest } from '@/lib/types'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Flex,
  Form,
  FormItem,
  Input,
  Radio,
  Typography,
} from '@/components/ui'

const { Title, Paragraph, Text } = Typography

export default function CadastroPage() {
  const router = useRouter()
  const { signup, isAuthenticated, loading: authLoading } = useCurrentUser()
  const [form] = Form.useForm()
  const tipo = Form.useWatch('tipo', form) as 'PF' | 'PJ' | undefined
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace('/')
  }, [authLoading, isAuthenticated, router])

  async function onFinish(values: Record<string, unknown>) {
    setError(null)
    setSubmitting(true)
    try {
      const body: SignupRequest = {
        tipo: values.tipo as 'PF' | 'PJ',
        email: String(values.email),
        senha: String(values.senha),
        telefone: values.telefone ? String(values.telefone) : undefined,
        aceitaTermos: Boolean(values.aceitaTermos),
        aceitaPrivacidade: Boolean(values.aceitaPrivacidade),
        cookiesComportamentais: Boolean(values.cookiesComportamentais),
        contatoProativo: Boolean(values.contatoProativo),
      }
      if (body.tipo === 'PF') {
        body.cpf = String(values.cpf ?? '')
        body.nomeCompleto = String(values.nomeCompleto ?? '')
        if (values.idade) body.idade = Number(values.idade)
      } else {
        body.cnpj = String(values.cnpj ?? '')
        body.razaoSocial = String(values.razaoSocial ?? '')
      }
      await signup(body)
      router.replace('/')
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Flex justify="center" style={{ padding: '48px 24px' }}>
      <Card style={{ width: '100%', maxWidth: 480 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Criar conta
        </Title>
        <Paragraph type="secondary">Cadastro PF ou PJ com consentimentos LGPD.</Paragraph>

        {error && (
          <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ tipo: 'PF' }}
          requiredMark={false}
        >
          <FormItem
            name="tipo"
            label="Tipo de conta"
            tooltip="Pessoa física (CPF) ou jurídica (CNPJ)"
            rules={[{ required: true }]}
          >
            <Radio.Group id="cadastro-tipo">
              <Radio value="PF">Pessoa física</Radio>
              <Radio value="PJ">Pessoa jurídica</Radio>
            </Radio.Group>
          </FormItem>

          <FormItem
            name="email"
            label="E-mail"
            tooltip="Será o login da conta"
            rules={[
              { required: true, message: 'Informe o e-mail' },
              { type: 'email', message: 'E-mail inválido' },
            ]}
          >
            <Input id="cadastro-email" placeholder="Informe o e-mail" />
          </FormItem>

          <FormItem
            name="senha"
            label="Senha"
            tooltip="Mínimo recomendado: 8 caracteres"
            rules={[{ required: true, message: 'Informe a senha' }, { min: 6 }]}
          >
            <Input.Password id="cadastro-senha" placeholder="Informe a senha" />
          </FormItem>

          <FormItem name="telefone" label="Telefone" tooltip="Opcional — para contato">
            <Input id="cadastro-telefone" placeholder="Informe o telefone" />
          </FormItem>

          {tipo === 'PF' && (
            <>
              <FormItem
                name="nomeCompleto"
                label="Nome completo"
                tooltip="Nome civil completo"
                rules={[{ required: true, message: 'Informe o nome completo' }]}
              >
                <Input id="cadastro-nome" placeholder="Informe o nome completo" />
              </FormItem>
              <FormItem
                name="cpf"
                label="CPF"
                tooltip="Somente números ou com máscara"
                rules={[{ required: true, message: 'Informe o CPF' }]}
              >
                <Input id="cadastro-cpf" placeholder="Informe o CPF" />
              </FormItem>
              <FormItem name="idade" label="Idade" tooltip="Opcional">
                <Input id="cadastro-idade" type="number" placeholder="Informe a idade" />
              </FormItem>
            </>
          )}

          {tipo === 'PJ' && (
            <>
              <FormItem
                name="razaoSocial"
                label="Razão social"
                tooltip="Nome empresarial registrado"
                rules={[{ required: true, message: 'Informe a razão social' }]}
              >
                <Input id="cadastro-razao" placeholder="Informe a razão social" />
              </FormItem>
              <FormItem
                name="cnpj"
                label="CNPJ"
                tooltip="Somente números ou com máscara"
                rules={[{ required: true, message: 'Informe o CNPJ' }]}
              >
                <Input id="cadastro-cnpj" placeholder="Informe o CNPJ" />
              </FormItem>
            </>
          )}

          <FormItem
            name="aceitaTermos"
            valuePropName="checked"
            tooltip="Aceite obrigatório dos Termos de Uso"
            rules={[
              {
                validator: (_, v) =>
                  v ? Promise.resolve() : Promise.reject(new Error('Aceite os Termos de Uso')),
              },
            ]}
          >
            <Checkbox id="cadastro-termos">
              Li e aceito os <Link href="/termos">Termos de Uso</Link>
            </Checkbox>
          </FormItem>

          <FormItem
            name="aceitaPrivacidade"
            valuePropName="checked"
            tooltip="Aceite obrigatório da Política de Privacidade"
            rules={[
              {
                validator: (_, v) =>
                  v
                    ? Promise.resolve()
                    : Promise.reject(new Error('Aceite a Política de Privacidade')),
              },
            ]}
          >
            <Checkbox id="cadastro-privacidade">
              Li e aceito a <Link href="/privacidade">Política de Privacidade</Link>
            </Checkbox>
          </FormItem>

          <FormItem
            name="cookiesComportamentais"
            valuePropName="checked"
            tooltip="Permite coleta para recomendações personalizadas"
          >
            <Checkbox id="cadastro-cookies">Aceito cookies comportamentais</Checkbox>
          </FormItem>

          <FormItem
            name="contatoProativo"
            valuePropName="checked"
            tooltip="Permite contato comercial do dono do catálogo"
          >
            <Checkbox id="cadastro-contato">Aceito contato proativo</Checkbox>
          </FormItem>

          <Button
            id="cadastro-submit"
            color="primary"
            htmlType="submit"
            loading={submitting}
            block
          >
            Cadastrar
          </Button>
        </Form>

        <Text style={{ display: 'block', marginTop: 16 }}>
          Já tem conta? <Link href="/entrar">Entrar</Link>
        </Text>
      </Card>
    </Flex>
  )
}
