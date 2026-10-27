'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getConta,
  requestAccountDeletion,
  updateConta,
  updateConsentimentos,
} from '@/lib/api/conta'
import { toApiError } from '@/lib/api/client'
import { formatCnpj, formatCpf, formatTelefone } from '@/lib/formatters'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import type { ConsentimentoLgpd, Usuario } from '@/lib/types'
import {
  Alert,
  Button,
  Collapse,
  Flex,
  Form,
  FormItem,
  Input,
  Modal,
  Spin,
  Switch,
  Tabs,
  Typography,
} from '@/components/ui'

const { Title, Paragraph, Text } = Typography

export default function ContaPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, logout } = useCurrentUser()
  const { api, contextHolder } = useAppNotification()
  const [form] = Form.useForm()
  const [conta, setConta] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cookies, setCookies] = useState(true)
  const [contato, setContato] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || !user) {
      router.replace('/entrar?next=/conta')
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (!user) return
    const t = window.setTimeout(() => {
      setLoading(true)
      void getConta(user.id)
        .then((u) => {
          setConta(u)
          form.setFieldsValue({
            telefone: u.telefone ?? '',
            emailAlternativo: u.emailAlternativo ?? '',
            nomeCompleto: u.nomeCompleto ?? '',
          })
        })
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(t)
  }, [user, form])

  async function onSave(values: {
    telefone?: string
    emailAlternativo?: string
    nomeCompleto?: string
  }) {
    if (!user) return
    setError(null)
    setSaving(true)
    try {
      const updated = await updateConta(user.id, {
        telefone: values.telefone || null,
        emailAlternativo: values.emailAlternativo || null,
        nomeCompleto: values.nomeCompleto || null,
      })
      setConta(updated)
      api.success({ message: 'Dados salvos' })
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  async function onSaveConsent() {
    if (!user) return
    const now = new Date().toISOString()
    const list: ConsentimentoLgpd[] = [
      {
        tipo: 'COOKIES_COMPORTAMENTAIS',
        aceito: cookies,
        versaoTermos: '1.0',
        aceitoEm: now,
      },
      {
        tipo: 'CONTATO_PROATIVO',
        aceito: contato,
        versaoTermos: '1.0',
        aceitoEm: now,
      },
    ]
    await updateConsentimentos(user.id, list)
    api.success({ message: 'Preferências de privacidade salvas' })
  }

  function onDeleteAccount() {
    Modal.confirm({
      title: 'Excluir conta?',
      content: 'Solicitação de exclusão LGPD. Esta ação é permanente após processamento.',
      okText: 'Excluir conta',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        if (!user) return
        await requestAccountDeletion(user.id)
        await logout()
        router.replace('/')
      },
    })
  }

  if (authLoading || loading || !conta) {
    return (
      <Flex justify="center" style={{ padding: 64 }}>
        {contextHolder}
        <Spin />
      </Flex>
    )
  }

  return (
    <Flex vertical gap={24} style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px' }}>
      {contextHolder}
      <Title level={2} id="conta-title" style={{ marginBottom: 0 }}>
        Minha conta
      </Title>

      <Tabs
        items={[
          {
            key: 'dados',
            label: 'Dados',
            children: (
              <>
                {error && (
                  <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />
                )}
                <Paragraph type="secondary">
                  E-mail: <Text strong>{conta.email}</Text>
                  {conta.tipo === 'PF' && conta.cpf && (
                    <>
                      <br />
                      CPF: {formatCpf(conta.cpf)}
                    </>
                  )}
                  {conta.tipo === 'PJ' && conta.cnpj && (
                    <>
                      <br />
                      CNPJ: {formatCnpj(conta.cnpj)}
                      {conta.razaoSocial && (
                        <>
                          <br />
                          Razão social: {conta.razaoSocial}
                        </>
                      )}
                    </>
                  )}
                </Paragraph>
                <Form form={form} layout="vertical" onFinish={onSave} requiredMark={false}>
                  {conta.tipo === 'PF' && (
                    <FormItem
                      name="nomeCompleto"
                      label="Nome completo"
                      tooltip="Nome civil completo"
                    >
                      <Input id="conta-nome" placeholder="Informe o nome completo" />
                    </FormItem>
                  )}
                  <FormItem name="telefone" label="Telefone" tooltip="WhatsApp / contato">
                    <Input
                      id="conta-telefone"
                      placeholder="Informe o telefone"
                      onBlur={(e) =>
                        form.setFieldValue('telefone', formatTelefone(e.target.value))
                      }
                    />
                  </FormItem>
                  <FormItem
                    name="emailAlternativo"
                    label="E-mail alternativo"
                    tooltip="Opcional para recuperação"
                  >
                    <Input id="conta-email-alt" placeholder="Informe o e-mail alternativo" />
                  </FormItem>
                  <Button id="conta-salvar" color="primary" htmlType="submit" loading={saving}>
                    Salvar
                  </Button>
                </Form>
              </>
            ),
          },
          {
            key: 'privacidade',
            label: 'Privacidade',
            children: (
              <Flex vertical gap="large">
                <Flex justify="space-between" align="center">
                  <div>
                    <Text strong>Cookies comportamentais</Text>
                    <br />
                    <Text type="secondary">Personalização e métricas de interesse</Text>
                  </div>
                  <Switch
                    id="conta-cookies"
                    checked={cookies}
                    onChange={setCookies}
                  />
                </Flex>
                <Flex justify="space-between" align="center">
                  <div>
                    <Text strong>Contato proativo</Text>
                    <br />
                    <Text type="secondary">Permite abordagem comercial</Text>
                  </div>
                  <Switch id="conta-contato" checked={contato} onChange={setContato} />
                </Flex>
                <Button id="conta-salvar-consent" onClick={() => void onSaveConsent()}>
                  Salvar preferências
                </Button>
                <Button id="conta-exportar" variant="outlined">
                  Exportar meus dados (mock)
                </Button>
                <Button id="conta-excluir" color="danger" onClick={onDeleteAccount}>
                  Solicitar exclusão da conta
                </Button>
              </Flex>
            ),
          },
          {
            key: 'ajuda',
            label: 'Ajuda',
            children: (
              <Collapse
                items={[
                  {
                    key: '1',
                    label: 'Como funciona o contato?',
                    children:
                      'O CTA abre o WhatsApp do dono do catálogo. Não há pagamento nesta plataforma.',
                  },
                  {
                    key: '2',
                    label: 'Como personalizar recomendações?',
                    children:
                      'Aceite cookies comportamentais no banner ou nesta aba. Sem consentimento, a ordenação usa popularidade global.',
                  },
                  {
                    key: '3',
                    label: 'Suporte',
                    children: (
                      <>
                        Dúvidas: veja também <Link href="/sobre">Sobre o projeto</Link> e{' '}
                        <Link href="/privacidade">Privacidade</Link>.
                      </>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </Flex>
  )
}
