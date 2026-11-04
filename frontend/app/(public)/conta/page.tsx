'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogoutOutlined } from '@ant-design/icons'
import {
  exportarConta,
  getConta,
  requestAccountDeletion,
  updateConta,
  updateConsentimentos,
} from '@/lib/api/conta'
import { toApiError } from '@/lib/api/client'
import { formatCnpj, formatCpf, formatTelefone } from '@/lib/formatters'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { isValidTelefone, normalizeTelefone, telefoneForMask } from '@/lib/validators'
import type { ConsentimentoLgpd, Usuario } from '@/lib/types'
import { PageError, PageLoading } from '@/components/layout/PageStates'
import {
  Alert,
  App,
  Button,
  Collapse,
  Descriptions,
  Divider,
  Flex,
  Form,
  FormItem,
  Input,
  Switch,
  Tabs,
  Typography,
} from '@/components/ui'

const { Title, Text } = Typography

type TipoConsentimento = ConsentimentoLgpd['tipo']

export default function ContaPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading, logout } = useCurrentUser()
  const { acceptCustom, canTrackBehavioral } = useCookieConsent()
  const { modal } = App.useApp()
  const { api, contextHolder } = useAppNotification()
  const [form] = Form.useForm()
  const [conta, setConta] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contato, setContato] = useState(false)
  const [salvandoConsent, setSalvandoConsent] = useState<TipoConsentimento | null>(null)
  const saindo = useRef(false)

  useEffect(() => {
    if (authLoading || saindo.current) return
    if (!isAuthenticated || !user) {
      router.replace('/entrar?next=/conta')
    }
  }, [authLoading, isAuthenticated, user, router])

  useEffect(() => {
    if (!user) return
    const t = window.setTimeout(() => {
      setLoading(true)
      setFalhou(false)
      getConta(user.id)
        .then((data) => {
          setConta(data.usuario)
          form.setFieldsValue({
            telefone: data.usuario.telefone
              ? formatTelefone(telefoneForMask(data.usuario.telefone))
              : '',
            emailAlternativo: data.usuario.emailAlternativo ?? '',
            nomeCompleto: data.usuario.nomeCompleto ?? '',
          })
          const contatoConsent = data.consentimentos.find((c) => c.tipo === 'CONTATO_PROATIVO')
          if (contatoConsent) setContato(contatoConsent.aceito)
        })
        .catch(() => setFalhou(true))
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(t)
  }, [user, form, tentativa])

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
        telefone: normalizeTelefone(values.telefone),
        emailAlternativo: values.emailAlternativo || null,
        nomeCompleto: values.nomeCompleto || null,
      })
      setConta(updated)
      api.success({ title: 'Dados salvos' })
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  /** Salva ao alternar. O gate local muda antes da API: revogar para a coleta na hora. */
  async function onToggleConsent(tipo: TipoConsentimento, aceito: boolean) {
    if (!user) return
    const aplicar = (valor: boolean) => {
      if (tipo === 'COOKIES_COMPORTAMENTAIS') {
        acceptCustom(valor)
      } else {
        setContato(valor)
      }
    }

    aplicar(aceito)
    setSalvandoConsent(tipo)
    try {
      await updateConsentimentos(user.id, [
        { tipo, aceito, versaoTermos: '1.0', aceitoEm: new Date().toISOString() },
      ])
      api.success({ title: 'Preferência salva' })
    } catch (e) {
      aplicar(!aceito)
      api.error({ title: toApiError(e).message })
    } finally {
      setSalvandoConsent(null)
    }
  }

  async function onExport() {
    try {
      const blob = await exportarConta('json')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'meus-dados-catalogo.json'
      a.click()
      URL.revokeObjectURL(url)
      api.success({ title: 'Exportação baixada' })
    } catch (e) {
      api.error({ title: toApiError(e).message })
    }
  }

  /** Vai para a vitrine; sem `saindo`, o guarda de auth mandaria para /entrar?next=/conta. */
  async function sair() {
    saindo.current = true
    try {
      await logout()
      router.replace('/')
    } catch (e) {
      saindo.current = false
      api.error({ title: toApiError(e).message })
    }
  }

  function onDeleteAccount() {
    modal.confirm({
      title: 'Excluir conta?',
      content: 'Solicitação de exclusão LGPD. Esta ação é permanente após processamento.',
      okText: 'Excluir conta',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        if (!user) return
        try {
          await requestAccountDeletion(user.id)
          await sair()
        } catch (e) {
          api.error({ title: toApiError(e).message })
        }
      },
    })
  }

  if (authLoading || (loading && !falhou)) return <PageLoading />
  if (falhou || !conta) return <PageError onRetry={() => setTentativa((n) => n + 1)} />

  const identificacao = [
    { key: 'email', label: 'E-mail', children: conta.email },
    ...(conta.tipo === 'PF' && conta.cpf
      ? [{ key: 'cpf', label: 'CPF', children: formatCpf(conta.cpf) }]
      : []),
    ...(conta.tipo === 'PJ' && conta.cnpj
      ? [{ key: 'cnpj', label: 'CNPJ', children: formatCnpj(conta.cnpj) }]
      : []),
    ...(conta.tipo === 'PJ' && conta.razaoSocial
      ? [{ key: 'razao', label: 'Razão social', children: conta.razaoSocial }]
      : []),
  ]

  return (
    <Flex vertical className="page page--narrow" style={{ gap: 'var(--space-4)' }}>
      {contextHolder}
      <Title level={1} id="conta-title" style={{ margin: 0 }}>
        Minha conta
      </Title>

      <Tabs
        items={[
          {
            key: 'dados',
            label: 'Dados',
            children: (
              <Flex vertical gap="middle">
                {error && <Alert type="error" showIcon title={error} />}
                <Descriptions size="small" column={1} items={identificacao} />
                <Form form={form} layout="vertical" onFinish={onSave} requiredMark={false}>
                  {conta.tipo === 'PF' && (
                    <FormItem
                      name="nomeCompleto"
                      label="Nome completo"
                      tooltip="Nome civil completo"
                      rules={[
                        { required: true, message: 'Informe o nome completo' },
                        { min: 3, message: 'Nome completo deve ter no mínimo 3 caracteres' },
                      ]}
                    >
                      <Input id="conta-nome" placeholder="Informe o nome completo" />
                    </FormItem>
                  )}
                  <FormItem
                    name="telefone"
                    label="Telefone"
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
                      id="conta-telefone"
                      placeholder="(47) 99999-0000"
                      autoComplete="tel"
                      onBlur={(e) => {
                        const national = telefoneForMask(e.target.value)
                        if (national) form.setFieldValue('telefone', formatTelefone(national))
                      }}
                    />
                  </FormItem>
                  <FormItem
                    name="emailAlternativo"
                    label="E-mail alternativo"
                    tooltip="Usado na recuperação da conta"
                    rules={[{ type: 'email', message: 'E-mail inválido' }]}
                  >
                    <Input id="conta-email-alt" placeholder="Informe o e-mail alternativo" />
                  </FormItem>
                  <Button id="conta-salvar" color="primary" htmlType="submit" loading={saving}>
                    Salvar
                  </Button>
                </Form>
              </Flex>
            ),
          },
          {
            key: 'privacidade',
            label: 'Privacidade',
            children: (
              <Flex vertical gap="middle">
                <Flex justify="space-between" align="center" gap="middle">
                  <Flex vertical>
                    <Text strong>Cookies comportamentais</Text>
                    <Text type="secondary">Personalização e métricas de interesse</Text>
                  </Flex>
                  <Switch
                    id="conta-cookies"
                    aria-label="Cookies comportamentais"
                    checked={canTrackBehavioral}
                    loading={salvandoConsent === 'COOKIES_COMPORTAMENTAIS'}
                    onChange={(v) => void onToggleConsent('COOKIES_COMPORTAMENTAIS', v)}
                  />
                </Flex>
                <Flex justify="space-between" align="center" gap="middle">
                  <Flex vertical>
                    <Text strong>Contato proativo</Text>
                    <Text type="secondary">Permite abordagem comercial</Text>
                  </Flex>
                  <Switch
                    id="conta-contato"
                    aria-label="Contato proativo"
                    checked={contato}
                    loading={salvandoConsent === 'CONTATO_PROATIVO'}
                    onChange={(v) => void onToggleConsent('CONTATO_PROATIVO', v)}
                  />
                </Flex>

                <Divider style={{ margin: 0 }} />

                <Flex vertical gap="small">
                  <Text strong>Seus dados</Text>
                  <Text type="secondary">
                    Baixe uma cópia dos seus dados ou solicite a exclusão da conta.
                  </Text>
                  <Flex gap="small" wrap="wrap">
                    <Button id="conta-exportar" onClick={() => void onExport()}>
                      Exportar meus dados
                    </Button>
                    <Button id="conta-excluir" color="danger" onClick={onDeleteAccount}>
                      Solicitar exclusão da conta
                    </Button>
                  </Flex>
                </Flex>
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
                      'O botão Entrar em contato abre o WhatsApp do dono do catálogo. Não há pagamento nesta plataforma.',
                  },
                  {
                    key: '2',
                    label: 'Como personalizar recomendações?',
                    children:
                      'Aceite cookies comportamentais no banner ou na aba Privacidade. Sem consentimento, a ordenação usa popularidade global.',
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

      <Divider style={{ margin: 0 }} />
      <Button
        id="conta-sair"
        variant="text"
        icon={<LogoutOutlined />}
        style={{ alignSelf: 'flex-start' }}
        onClick={() => void sair()}
      >
        Sair da conta
      </Button>
    </Flex>
  )
}
