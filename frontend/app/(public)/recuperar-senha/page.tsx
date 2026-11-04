'use client'

import { useState } from 'react'
import Link from 'next/link'
import { confirmPasswordReset, requestPasswordReset } from '@/lib/api/auth'
import { toApiError } from '@/lib/api/client'
import { USE_MOCK } from '@/lib/api/config'
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  FormItem,
  Input,
  Result,
  Steps,
  Typography,
} from '@/components/ui'

const { Title, Paragraph } = Typography

const TOKEN_MOCK = 'mock-reset'

export default function RecuperarSenhaPage() {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [form1] = Form.useForm()
  const [form2] = Form.useForm()

  async function solicitar(values: { email: string }) {
    setError(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(values.email)
      setEmail(values.email)
      setStep(1)
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSubmitting(false)
    }
  }

  async function redefinir(values: { token: string; novaSenha: string }) {
    setError(null)
    setSubmitting(true)
    try {
      await confirmPasswordReset(values.token, values.novaSenha)
      setDone(true)
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <Flex vertical className="page page--auth">
        <Result
          status="success"
          title="Senha redefinida"
          subTitle="Você já pode entrar com a nova senha."
          extra={
            <Button color="primary" id="recuperar-ir-entrar" href="/entrar">
              Ir para entrar
            </Button>
          }
        />
      </Flex>
    )
  }

  return (
    <Flex vertical className="page page--auth">
      <Card className="auth-card">
        <Title level={1} style={{ marginTop: 0 }}>
          Recuperar senha
        </Title>
        <Paragraph type="secondary">
          Informe seu e-mail e depois defina uma nova senha.
        </Paragraph>

        <Steps
          current={step}
          size="small"
          style={{ marginBottom: 'var(--space-6)' }}
          items={[{ title: 'Solicitar' }, { title: 'Redefinir' }]}
        />

        {error && (
          <Alert type="error" showIcon title={error} style={{ marginBottom: 'var(--space-4)' }} />
        )}

        {step === 0 && (
          <Form form={form1} layout="vertical" onFinish={solicitar} requiredMark={false}>
            <FormItem
              name="email"
              label="E-mail"
              tooltip="Enviaremos as instruções se a conta existir"
              rules={[
                { required: true, message: 'Informe o e-mail' },
                { type: 'email', message: 'E-mail inválido' },
              ]}
            >
              <Input id="recuperar-email" placeholder="Informe o e-mail" autoComplete="email" />
            </FormItem>
            <Button
              id="recuperar-solicitar"
              color="primary"
              htmlType="submit"
              loading={submitting}
              block
            >
              Enviar instruções
            </Button>
          </Form>
        )}

        {step === 1 && (
          <>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 'var(--space-4)' }}
              title={`Se existir conta para ${email}, enviamos o código de redefinição.${
                USE_MOCK ? ` Ambiente de teste: use "${TOKEN_MOCK}".` : ''
              }`}
            />
            <Form form={form2} layout="vertical" onFinish={redefinir} requiredMark={false}>
              <FormItem
                name="token"
                label="Código"
                tooltip="Código recebido por e-mail"
                rules={[{ required: true, message: 'Informe o código' }]}
                initialValue={USE_MOCK ? TOKEN_MOCK : undefined}
              >
                <Input id="recuperar-token" placeholder="Informe o código" />
              </FormItem>
              <FormItem
                name="novaSenha"
                label="Nova senha"
                tooltip="Mínimo 6 caracteres"
                rules={[
                  { required: true, message: 'Informe a nova senha' },
                  { min: 6, message: 'A senha deve ter no mínimo 6 caracteres' },
                ]}
              >
                <Input.Password
                  id="recuperar-nova-senha"
                  placeholder="Informe a nova senha"
                  autoComplete="new-password"
                />
              </FormItem>
              <FormItem
                name="confirma"
                label="Confirmar senha"
                tooltip="Repita a nova senha"
                dependencies={['novaSenha']}
                rules={[
                  { required: true, message: 'Confirme a senha' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('novaSenha') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('As senhas não coincidem'))
                    },
                  }),
                ]}
              >
                <Input.Password
                  id="recuperar-confirma"
                  placeholder="Informe a confirmação"
                  autoComplete="new-password"
                />
              </FormItem>
              <Button
                id="recuperar-confirmar"
                color="primary"
                htmlType="submit"
                loading={submitting}
                block
              >
                Redefinir senha
              </Button>
            </Form>
          </>
        )}

        <Paragraph style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
          <Link href="/entrar">Voltar ao login</Link>
        </Paragraph>
      </Card>
    </Flex>
  )
}
