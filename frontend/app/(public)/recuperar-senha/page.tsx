'use client'

import { useState } from 'react'
import Link from 'next/link'
import { confirmPasswordReset, requestPasswordReset } from '@/lib/api/auth'
import { toApiError } from '@/lib/api/client'
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
      <Flex justify="center" style={{ padding: '48px 24px' }}>
        <Result
          status="success"
          title="Senha redefinida"
          subTitle="Você já pode entrar com a nova senha."
          extra={
            <Link href="/entrar">
              <Button color="primary" id="recuperar-ir-entrar">
                Ir para entrar
              </Button>
            </Link>
          }
        />
      </Flex>
    )
  }

  return (
    <Flex justify="center" style={{ padding: '48px 24px' }}>
      <Card style={{ width: '100%', maxWidth: 440 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Recuperar senha
        </Title>
        <Paragraph type="secondary">
          Duas etapas: solicitar o e-mail e definir a nova senha.
        </Paragraph>

        <Steps
          current={step}
          size="small"
          style={{ marginBottom: 24 }}
          items={[{ title: 'Solicitar' }, { title: 'Redefinir' }]}
        />

        {error && (
          <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />
        )}

        {step === 0 && (
          <Form form={form1} layout="vertical" onFinish={solicitar} requiredMark={false}>
            <FormItem
              name="email"
              label="E-mail"
              tooltip="Enviaremos instruções se a conta existir (sem enumerar usuários)"
              rules={[
                { required: true, message: 'Informe o e-mail' },
                { type: 'email', message: 'E-mail inválido' },
              ]}
            >
              <Input id="recuperar-email" placeholder="Informe o e-mail" />
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
              style={{ marginBottom: 16 }}
              title={`Se existir conta para ${email}, o token de redefinição foi enviado (mock: use token "mock-reset").`}
            />
            <Form form={form2} layout="vertical" onFinish={redefinir} requiredMark={false}>
              <FormItem
                name="token"
                label="Token"
                tooltip="Código recebido por e-mail"
                rules={[{ required: true, message: 'Informe o token' }]}
                initialValue="mock-reset"
              >
                <Input id="recuperar-token" placeholder="Informe o token" />
              </FormItem>
              <FormItem
                name="novaSenha"
                label="Nova senha"
                tooltip="Defina a nova senha de acesso"
                rules={[{ required: true, message: 'Informe a nova senha' }, { min: 6 }]}
              >
                <Input.Password id="recuperar-nova-senha" placeholder="Informe a nova senha" />
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
                <Input.Password id="recuperar-confirma" placeholder="Informe a confirmação" />
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

        <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
          <Link href="/entrar">Voltar ao login</Link>
        </Paragraph>
      </Card>
    </Flex>
  )
}
