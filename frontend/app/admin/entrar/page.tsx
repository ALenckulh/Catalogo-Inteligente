'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { LoginOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function AdminEntrarPage() {
  const router = useRouter()
  const { loginAdmin, isAdmin, loading: authLoading } = useCurrentUser()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isAdmin) router.replace('/admin')
  }, [authLoading, isAdmin, router])

  async function onFinish(values: { email: string; senha: string }) {
    setError(null)
    setSubmitting(true)
    try {
      await loginAdmin(values)
      router.replace('/admin')
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Flex justify="center" align="center" style={{ minHeight: '100vh', padding: 24 }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Title level={3} style={{ marginTop: 0 }}>
          Admin — Entrar
        </Title>
        <Paragraph type="secondary">Acesso restrito ao dono do catálogo.</Paragraph>
        {error && (
          <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />
        )}
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          <FormItem
            name="email"
            label="E-mail"
            tooltip="E-mail da conta ADMIN"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input id="admin-entrar-email" placeholder="Informe o e-mail" />
          </FormItem>
          <FormItem
            name="senha"
            label="Senha"
            tooltip="Senha administrativa"
            rules={[{ required: true }]}
          >
            <Input.Password id="admin-entrar-senha" placeholder="Informe a senha" />
          </FormItem>
          <Button
            id="admin-entrar-submit"
            color="primary"
            htmlType="submit"
            loading={submitting}
            block
            icon={<LoginOutlined />}
          >
            Entrar
          </Button>
        </Form>
      </Card>
    </Flex>
  )
}
