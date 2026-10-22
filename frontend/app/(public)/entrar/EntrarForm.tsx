'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toApiError } from '@/lib/api/client'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import {
  Alert,
  Button,
  Card,
  Flex,
  Form,
  FormItem,
  Input,
  Typography,
} from '@/components/ui'

const { Title, Paragraph, Text } = Typography

export function EntrarForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const { login, isAuthenticated, loading: authLoading } = useCurrentUser()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(next)
    }
  }, [authLoading, isAuthenticated, next, router])

  async function onFinish(values: { email: string; senha: string }) {
    setError(null)
    setSubmitting(true)
    try {
      await login(values)
      router.replace(next)
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card style={{ width: '100%', maxWidth: 400 }}>
      <Title level={3} style={{ marginTop: 0 }}>
        Entrar
      </Title>
      <Paragraph type="secondary">Acesse sua conta PF ou PJ.</Paragraph>

      {error && (
        <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <FormItem
          name="email"
          label="E-mail"
          tooltip="E-mail cadastrado na conta"
          rules={[
            { required: true, message: 'Informe o e-mail' },
            { type: 'email', message: 'E-mail inválido' },
          ]}
        >
          <Input id="entrar-email" placeholder="Informe o e-mail" autoComplete="email" />
        </FormItem>
        <FormItem
          name="senha"
          label="Senha"
          tooltip="Senha de acesso à conta"
          rules={[{ required: true, message: 'Informe a senha' }]}
        >
          <Input.Password
            id="entrar-senha"
            placeholder="Informe a senha"
            autoComplete="current-password"
          />
        </FormItem>
        <Button
          id="entrar-submit"
          color="primary"
          htmlType="submit"
          loading={submitting}
          block
        >
          Entrar
        </Button>
      </Form>

      <Flex vertical gap={8} style={{ marginTop: 16 }}>
        <Text>
          <Link href="/recuperar-senha">Esqueci a senha</Link>
        </Text>
        <Text>
          Não tem conta? <Link href="/cadastro">Criar conta</Link>
        </Text>
      </Flex>
    </Card>
  )
}
