'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toApiError } from '@/lib/api/client'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { PrivacidadeConteudo, TermosConteudo } from '@/components/LegalConteudo'
import { formatCnpj, formatCpf, formatTelefone, onlyDigits } from '@/lib/formatters'
import { entrarHref, safeNext } from '@/lib/navigation'
import {
  isValidCnpj,
  isValidCpf,
  isValidIdade,
  isValidTelefone,
  normalizeTelefone,
  telefoneForMask,
} from '@/lib/validators'
import type { SignupRequest } from '@/lib/types'
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Form,
  FormItem,
  Input,
  Modal,
  Radio,
  Row,
  Tabs,
  Typography,
} from '@/components/ui'

const { Title, Paragraph, Text, Link: TextLink } = Typography

export function CadastroForm() {
  const router = useRouter()
  const next = safeNext(useSearchParams().get('next'))
  const { message } = App.useApp()
  const { signup, isAuthenticated, loading: authLoading } = useCurrentUser()
  const { canTrackBehavioral } = useCookieConsent()
  const [form] = Form.useForm()
  const tipo = Form.useWatch('tipo', form) as 'PF' | 'PJ' | undefined
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termosOpen, setTermosOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && isAuthenticated) router.replace(next)
  }, [authLoading, isAuthenticated, next, router])

  async function onFinish(values: Record<string, unknown>) {
    setError(null)
    setSubmitting(true)
    try {
      const telefoneDigits = normalizeTelefone(
        values.telefone ? String(values.telefone) : undefined,
      )
      const body: SignupRequest = {
        tipo: values.tipo as 'PF' | 'PJ',
        email: String(values.email).trim(),
        senha: String(values.senha),
        telefone: telefoneDigits ?? undefined,
        emailAlternativo: values.emailAlternativo
          ? String(values.emailAlternativo).trim()
          : undefined,
        aceitaTermos: Boolean(values.aceite),
        aceitaPrivacidade: Boolean(values.aceite),
        // Consentimentos opcionais não entram no aceite (LGPD): cookies vêm do banner
        // e contato começa desligado; os dois ficam revogáveis em /conta.
        cookiesComportamentais: canTrackBehavioral,
        contatoProativo: false,
      }
      if (body.tipo === 'PF') {
        body.cpf = onlyDigits(String(values.cpf ?? ''))
        body.nomeCompleto = String(values.nomeCompleto ?? '').trim()
        if (values.idade !== undefined && values.idade !== null && values.idade !== '') {
          body.idade = Number(values.idade)
        }
      } else {
        body.cnpj = onlyDigits(String(values.cnpj ?? ''))
        body.razaoSocial = String(values.razaoSocial ?? '').trim()
      }
      await signup(body)
      message.success('Conta criada')
      router.replace(next)
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="auth-card auth-card--wide">
      <Title level={1} style={{ marginTop: 0 }}>
        Criar conta
      </Title>
      <Paragraph type="secondary">
        Com a conta você fala com o dono do catálogo e salva favoritos.
      </Paragraph>

      {error && (
        <Alert type="error" showIcon title={error} style={{ marginBottom: 'var(--space-4)' }} />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ tipo: 'PJ' }}
        requiredMark={false}
      >
        <FormItem
          name="tipo"
          label="Tipo de conta"
          tooltip="Pessoa jurídica (CNPJ) ou física (CPF)"
          rules={[{ required: true, message: 'Selecione o tipo de conta' }]}
        >
          <Radio.Group id="cadastro-tipo">
            <Radio value="PJ">Pessoa jurídica</Radio>
            <Radio value="PF">Pessoa física</Radio>
          </Radio.Group>
        </FormItem>

        <Row gutter={16}>
          {tipo === 'PJ' && (
            <>
              <Col xs={24} sm={12}>
                <FormItem
                  name="razaoSocial"
                  label="Razão social"
                  tooltip="Nome empresarial registrado"
                  rules={[
                    { required: true, message: 'Informe a razão social' },
                    { min: 2, message: 'Razão social deve ter no mínimo 2 caracteres' },
                    {
                      validator: (_, v) =>
                        !v || String(v).trim().length >= 2
                          ? Promise.resolve()
                          : Promise.reject(new Error('Razão social inválida')),
                    },
                  ]}
                >
                  <Input id="cadastro-razao" placeholder="Informe a razão social" />
                </FormItem>
              </Col>
              <Col xs={24} sm={12}>
                <FormItem
                  name="cnpj"
                  label="CNPJ"
                  tooltip="Somente números ou com máscara"
                  rules={[
                    { required: true, message: 'Informe o CNPJ' },
                    {
                      validator: (_, v) =>
                        isValidCnpj(v)
                          ? Promise.resolve()
                          : Promise.reject(new Error('CNPJ inválido')),
                    },
                  ]}
                >
                  <Input
                    id="cadastro-cnpj"
                    placeholder="00.000.000/0000-00"
                    onBlur={(e) => {
                      const d = onlyDigits(e.target.value)
                      if (d) form.setFieldValue('cnpj', formatCnpj(d))
                    }}
                  />
                </FormItem>
              </Col>
            </>
          )}

          {tipo === 'PF' && (
            <>
              <Col xs={24} sm={12}>
                <FormItem
                  name="nomeCompleto"
                  label="Nome completo"
                  tooltip="Nome civil completo"
                  rules={[
                    { required: true, message: 'Informe o nome completo' },
                    { min: 3, message: 'Nome completo deve ter no mínimo 3 caracteres' },
                    {
                      validator: (_, v) =>
                        !v || String(v).trim().length >= 3
                          ? Promise.resolve()
                          : Promise.reject(new Error('Nome completo inválido')),
                    },
                  ]}
                >
                  <Input id="cadastro-nome" placeholder="Informe o nome completo" />
                </FormItem>
              </Col>
              <Col xs={24} sm={12}>
                <FormItem
                  name="cpf"
                  label="CPF"
                  tooltip="Somente números ou com máscara"
                  rules={[
                    { required: true, message: 'Informe o CPF' },
                    {
                      validator: (_, v) =>
                        isValidCpf(v)
                          ? Promise.resolve()
                          : Promise.reject(new Error('CPF inválido')),
                    },
                  ]}
                >
                  <Input
                    id="cadastro-cpf"
                    placeholder="000.000.000-00"
                    onBlur={(e) => {
                      const d = onlyDigits(e.target.value)
                      if (d) form.setFieldValue('cpf', formatCpf(d))
                    }}
                  />
                </FormItem>
              </Col>
            </>
          )}

          <Col xs={24} sm={12}>
            <FormItem
              name="email"
              label="E-mail"
              tooltip="Será o login da conta"
              rules={[
                { required: true, message: 'Informe o e-mail' },
                { type: 'email', message: 'E-mail inválido' },
              ]}
            >
              <Input id="cadastro-email" placeholder="Informe o e-mail" autoComplete="email" />
            </FormItem>
          </Col>
          <Col xs={24} sm={12}>
            <FormItem
              name="senha"
              label="Senha"
              tooltip="Mínimo 6 caracteres"
              rules={[
                { required: true, message: 'Informe a senha' },
                { min: 6, message: 'A senha deve ter no mínimo 6 caracteres' },
              ]}
            >
              <Input.Password
                id="cadastro-senha"
                placeholder="Informe a senha"
                autoComplete="new-password"
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12}>
            <FormItem
              name="telefone"
              label="Telefone (opcional)"
              tooltip="DDD + número, com ou sem +55"
              rules={[
                {
                  validator: (_, v) =>
                    isValidTelefone(v)
                      ? Promise.resolve()
                      : Promise.reject(new Error('Telefone inválido')),
                },
              ]}
            >
              <Input
                id="cadastro-telefone"
                placeholder="(47) 99999-0000"
                autoComplete="tel"
                onBlur={(e) => {
                  const national = telefoneForMask(e.target.value)
                  if (national) {
                    form.setFieldValue('telefone', formatTelefone(national))
                  }
                }}
              />
            </FormItem>
          </Col>
        </Row>

        <Collapse
          ghost
          size="small"
          style={{ marginBottom: 'var(--space-4)' }}
          items={[
            {
              key: 'opcionais',
              label: 'Mais dados (opcional)',
              children: (
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <FormItem
                      name="emailAlternativo"
                      label="E-mail alternativo"
                      tooltip="Usado na recuperação da conta"
                      rules={[{ type: 'email', message: 'E-mail inválido' }]}
                    >
                      <Input id="cadastro-email-alt" placeholder="Informe o e-mail alternativo" />
                    </FormItem>
                  </Col>
                  {tipo === 'PF' && (
                    <Col xs={24} sm={12}>
                      <FormItem
                        name="idade"
                        label="Idade"
                        tooltip="Entre 18 e 120"
                        rules={[
                          {
                            validator: (_, v) =>
                              isValidIdade(v)
                                ? Promise.resolve()
                                : Promise.reject(
                                    new Error('Idade deve ser um número entre 18 e 120'),
                                  ),
                          },
                        ]}
                      >
                        <Input
                          id="cadastro-idade"
                          type="number"
                          placeholder="Informe a idade"
                          min={18}
                          max={120}
                        />
                      </FormItem>
                    </Col>
                  )}
                </Row>
              ),
            },
          ]}
        />

        <FormItem
          name="aceite"
          valuePropName="checked"
          rules={[
            {
              validator: (_, v) =>
                v
                  ? Promise.resolve()
                  : Promise.reject(new Error('Aceite os Termos de Uso e a Política de Privacidade')),
            },
          ]}
        >
          <Checkbox id="cadastro-termos">
            Li e aceito os{' '}
            {/* href é fallback (clique do meio); o clique normal abre o modal sem marcar */}
            <TextLink
              id="cadastro-ver-termos"
              href="/termos"
              onClick={(e) => {
                e.preventDefault()
                setTermosOpen(true)
              }}
            >
              Termos de Uso e a Política de Privacidade
            </TextLink>
          </Checkbox>
        </FormItem>

        <Button id="cadastro-submit" color="primary" htmlType="submit" loading={submitting} block>
          Criar conta
        </Button>
      </Form>

      <Text style={{ display: 'block', marginTop: 'var(--space-4)' }}>
        Já tem conta? <Link href={next === '/' ? '/entrar' : entrarHref(next)}>Entrar</Link>
      </Text>

      <Modal
        title="Termos de Uso e Política de Privacidade"
        open={termosOpen}
        centered
        okText="Li e aceito"
        cancelText="Fechar"
        onCancel={() => setTermosOpen(false)}
        onOk={() => {
          form.setFields([{ name: 'aceite', value: true, errors: [] }])
          setTermosOpen(false)
        }}
        styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
      >
        <Tabs
          items={[
            { key: 'termos', label: 'Termos de Uso', children: <TermosConteudo nivel={4} /> },
            { key: 'privacidade', label: 'Privacidade', children: <PrivacidadeConteudo nivel={4} /> },
          ]}
        />
      </Modal>
    </Card>
  )
}
