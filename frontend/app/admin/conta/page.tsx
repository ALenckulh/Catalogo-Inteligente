'use client'

import { useEffect, useState } from 'react'
import { updateAdminConta } from '@/lib/api/admin'
import { toApiError } from '@/lib/api/client'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import {
  Alert,
  Button,
  Flex,
  Form,
  FormItem,
  Input,
  Spin,
  Typography,
} from '@/components/ui'
import { SaveOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function AdminContaPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const { user } = useCurrentUser()
  const { api, contextHolder } = useAppNotification()
  const [form] = Form.useForm()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    form.setFieldsValue({ email: user.email, telefone: user.telefone ?? '' })
  }, [user, form])

  async function onFinish(values: { email: string; telefone?: string; senhaAtual?: string; novaSenha?: string }) {
    setError(null)
    setSaving(true)
    try {
      await updateAdminConta({ email: values.email, telefone: values.telefone || null })
      api.success({ message: 'Conta atualizada' })
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        {contextHolder}
        <Spin />
      </Flex>
    )
  }

  return (
    <Flex vertical gap={16} style={{ maxWidth: 480 }}>
      {contextHolder}
      <Title level={3} style={{ margin: 0 }} id="admin-conta-title">
        Minha conta
      </Title>
      <Paragraph type="secondary">Altere e-mail, telefone ou senha (mock).</Paragraph>
      {error && <Alert type="error" showIcon title={error} />}
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <FormItem
          name="email"
          label="E-mail"
          tooltip="Login administrativo"
          rules={[{ required: true, type: 'email' }]}
        >
          <Input id="admin-conta-email" placeholder="Informe o e-mail" />
        </FormItem>
        <FormItem name="telefone" label="Telefone" tooltip="Contato do admin">
          <Input id="admin-conta-telefone" placeholder="Informe o telefone" />
        </FormItem>
        <FormItem name="senhaAtual" label="Senha atual" tooltip="Necessária para trocar a senha (mock)">
          <Input.Password id="admin-conta-senha-atual" placeholder="Informe a senha atual" />
        </FormItem>
        <FormItem name="novaSenha" label="Nova senha" tooltip="Deixe em branco para manter">
          <Input.Password id="admin-conta-nova-senha" placeholder="Informe a nova senha" />
        </FormItem>
        <Button
          id="admin-conta-salvar"
          color="primary"
          htmlType="submit"
          loading={saving}
          icon={<SaveOutlined />}
        >
          Salvar
        </Button>
      </Form>
    </Flex>
  )
}
