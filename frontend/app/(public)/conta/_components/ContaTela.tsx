'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogoutOutlined } from '@ant-design/icons'
import {
  getConta,
  requestAccountDeletion,
  updateConta,
  updateConsentimentos,
} from '@/lib/api/conta'
import { toApiError } from '@/lib/api/client'
import { liberarEventos } from '@/lib/api/eventos'
import { VERSAO_TERMOS } from '@/lib/config'
import { formatCnpj, formatCpf, formatTelefone } from '@/lib/formatters'
import { useAppNotification } from '@/lib/hooks/useAppNotification'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { desmarcarConta, marcarContaDecidida } from '@/lib/consentSync'
import { entrarHref } from '@/lib/navigation'
import { isValidTelefone, normalizeTelefone, telefoneForMask } from '@/lib/validators'
import type { ConsentimentoLgpd, Usuario } from '@/lib/types'
import { Ajuda } from '@/components/Ajuda'
import { DocumentoLegalCompacto, PRIVACIDADE } from '@/components/LegalConteudo'
import { PageError, PageLoading } from '@/components/layout/PageStates'
import {
  Alert,
  App,
  Button,
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

const ABAS = ['dados', 'privacidade', 'ajuda'] as const
type Aba = (typeof ABAS)[number]
const isAba = (v: string | null): v is Aba => ABAS.includes(v as Aba)

export function ContaTela() {
  const router = useRouter()
  const abaUrl = useSearchParams().get('aba')
  const aba: Aba = isAba(abaUrl) ? abaUrl : 'dados'
  const { user, isAuthenticated, loading: authLoading, logout, updateUser } = useCurrentUser()
  const { acceptCustom, canTrackBehavioral } = useCookieConsent()
  const { modal } = App.useApp()
  const { api } = useAppNotification()
  const [form] = Form.useForm()
  const [conta, setConta] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [falhou, setFalhou] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contato, setContato] = useState(false)
  /** Valor da conta; null enquanto ela nunca decidiu (aí vale a escolha deste navegador, que vai para ela). */
  const [cookiesConta, setCookiesConta] = useState<boolean | null>(null)
  const [salvandoConsent, setSalvandoConsent] = useState<TipoConsentimento | null>(null)
  const saindo = useRef(false)

  useEffect(() => {
    if (authLoading || saindo.current) return
    if (!isAuthenticated || !user) {
      router.replace(entrarHref(aba === 'dados' ? '/conta' : `/conta?aba=${aba}`))
    }
  }, [authLoading, isAuthenticated, user, router, aba])

  useEffect(() => {
    if (!user) return
    const t = window.setTimeout(() => {
      setLoading(true)
      setFalhou(false)
      setError(null)
      setContato(false)
      setCookiesConta(null)
      getConta(user.id)
        .then((data) => {
          // Os campos do Form vêm de `initialValues`: o <Form> só monta depois do loading, e chamar
          // form.setFieldsValue antes disso gerava o warning "useForm is not connected".
          setConta(data.usuario)
          const contatoConsent = data.consentimentos.find((c) => c.tipo === 'CONTATO_PROATIVO')
          if (contatoConsent) setContato(contatoConsent.aceito)
          const cookies = data.consentimentos.find((c) => c.tipo === 'COOKIES_COMPORTAMENTAIS')
          setCookiesConta(cookies?.aceito ?? null)
        })
        .catch(() => setFalhou(true))
        .finally(() => setLoading(false))
    }, 0)
    return () => window.clearTimeout(t)
  // Só o id: depois de salvar, updateUser troca o objeto `user` e não deve recarregar a conta.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tentativa])

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
      updateUser(updated)
      api.success({ title: 'Dados salvos' })
    } catch (e) {
      setError(toApiError(e).message)
    } finally {
      setSaving(false)
    }
  }

  const cookiesLigado = cookiesConta ?? canTrackBehavioral

  /** Salva ao alternar, na conta e neste navegador. O gate local muda antes da API: revogar para a coleta na hora. */
  async function onToggleConsent(tipo: TipoConsentimento, aceito: boolean) {
    if (!user) return
    const navegadorAntes = canTrackBehavioral
    const contaAntes = cookiesConta
    const cookies = tipo === 'COOKIES_COMPORTAMENTAIS'
    if (cookies) {
      marcarContaDecidida(user.id)
      acceptCustom(aceito)
      setCookiesConta(aceito)
    } else {
      setContato(aceito)
    }
    setSalvandoConsent(tipo)
    try {
      await updateConsentimentos(user.id, [{ tipo, aceito, versaoTermos: VERSAO_TERMOS }])
      if (cookies) liberarEventos()
      api.success({ title: 'Preferência salva' })
    } catch (e) {
      if (cookies) {
        acceptCustom(navegadorAntes)
        setCookiesConta(contaAntes)
        if (contaAntes === null) desmarcarConta(user.id)
      } else {
        setContato(!aceito)
      }
      api.error({ title: toApiError(e).message })
    } finally {
      setSalvandoConsent(null)
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
      // Enter logo ao abrir não pode excluir a conta.
      focusable: { autoFocusButton: 'cancel' },
      centered: true,
      onOk: async () => {
        if (!user) return
        // Antes do DELETE: a partir daqui o guarda de auth não pode mandar para /entrar?next=/conta.
        saindo.current = true
        try {
          await requestAccountDeletion(user.id)
        } catch (e) {
          saindo.current = false
          api.error({ title: toApiError(e).message })
          return
        }
        // O token da conta excluída já dá 401 no logout, e o interceptor limpa a sessão local.
        await logout().catch(() => undefined)
        router.replace('/')
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
      <Title level={1} id="conta-title" style={{ margin: 0 }}>
        Minha conta
      </Title>

      <Tabs
        activeKey={aba}
        onChange={(key) => router.replace(`/conta?aba=${key}`, { scroll: false })}
        items={[
          {
            key: 'dados',
            label: 'Dados',
            children: (
              <Flex vertical gap="middle">
                {error && <Alert type="error" showIcon title={error} />}
                <Descriptions size="small" column={1} items={identificacao} />
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onSave}
                  requiredMark={false}
                  // A conta pode trocar (login em outra aba): sem isto, os valores da anterior ficariam no form.
                  preserve={false}
                  initialValues={{
                    telefone: conta.telefone ? formatTelefone(telefoneForMask(conta.telefone)) : '',
                    emailAlternativo: conta.emailAlternativo ?? '',
                    nomeCompleto: conta.nomeCompleto ?? '',
                  }}
                >
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
                      <Input id="conta-nome" placeholder="Informe o nome completo" maxLength={255} />
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
                    checked={cookiesLigado}
                    loading={salvandoConsent === 'COOKIES_COMPORTAMENTAIS'}
                    onChange={(v) => void onToggleConsent('COOKIES_COMPORTAMENTAIS', v)}
                  />
                </Flex>
                {cookiesLigado && !canTrackBehavioral && (
                  <Alert
                    type="info"
                    showIcon
                    title="Sua conta aceita, mas este navegador não: nada é coletado aqui."
                    action={
                      <Button id="conta-cookies-navegador" size="small" onClick={() => acceptCustom(true)}>
                        Aceitar neste navegador
                      </Button>
                    }
                  />
                )}
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
                    Solicite a exclusão da conta.
                  </Text>
                  <Button
                    id="conta-excluir"
                    color="danger"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={onDeleteAccount}
                  >
                    Solicitar exclusão da conta
                  </Button>
                </Flex>

                <Divider style={{ margin: 0 }} />

                <DocumentoLegalCompacto doc={PRIVACIDADE} titulo={2} />
              </Flex>
            ),
          },
          {
            key: 'ajuda',
            label: 'Ajuda',
            children: <Ajuda />,
          },
        ]}
      />

      <Divider style={{ margin: 0 }} />
      <Button
        id="conta-sair"
        variant="text"
        color="danger"
        icon={<LogoutOutlined />}
        style={{ alignSelf: 'flex-start' }}
        onClick={() => void sair()}
      >
        Sair da conta
      </Button>
    </Flex>
  )
}
