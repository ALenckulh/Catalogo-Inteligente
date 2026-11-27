'use client'

import { useMemo, useState } from 'react'
import { MailOutlined, PhoneOutlined, WhatsAppOutlined } from '@ant-design/icons'
import { EMPRESA, whatsappUrl } from '@/lib/config'
import { Button, Card, Collapse, Empty, Flex, Input, Typography } from '@/components/ui'

const { Title, Paragraph, Text } = Typography

/**
 * Escrita (docs/09 §20): cada passo começa com verbo e faz uma coisa só; o botão vai entre aspas, com o nome
 * exato da tela, e o passo diz onde ele fica; no máximo três passos; nada de termo técnico.
 */
interface Pergunta {
  id: string
  pergunta: string
  /** Uma frase, quando a resposta não é um passo a passo (ou o contexto antes dos passos). */
  resumo?: string
  passos?: string[]
  /** Aviso ou alternativa, depois dos passos. */
  obs?: string
  /** Palavras que a pessoa usaria na busca e não estão no texto. */
  termos?: string
  acao?: { label: string; href: string }
}

const WHATSAPP_AJUDA = whatsappUrl('Olá! Preciso de ajuda com o site da Renova Retífica.')
const PRIVACIDADE_CONTA = { label: 'Abrir Privacidade', href: '/conta?aba=privacidade' }
const EMAIL_DADOS = `mailto:${EMPRESA.email}?subject=${encodeURIComponent('Cópia dos meus dados')}`
const ABRIR_PRIVACIDADE = 'Abra “Minha conta” (clique no seu nome, no topo do site) e entre na aba “Privacidade”.'

const GRUPOS: { titulo: string; perguntas: Pergunta[] }[] = [
  {
    titulo: 'Comprar e pedir orçamento',
    perguntas: [
      {
        id: 'comprar',
        pergunta: 'Como faço para comprar?',
        passos: [
          'Entre na sua conta pelo botão “Entrar”, no topo do site.',
          'Abra o produto e clique em “Entrar em contato”.',
          'No WhatsApp, que abre com o nome do produto, envie a mensagem e combine preço, pagamento e entrega com a loja.',
        ],
        obs: 'O site não tem carrinho nem pagamento: a compra é fechada no atendimento.',
        termos: 'carrinho pagamento pagar pix boleto cartão orçamento pedido',
        acao: { label: 'Ver catálogo', href: '/produtos' },
      },
      {
        id: 'whatsapp',
        pergunta: 'Cliquei em “Entrar em contato” e o WhatsApp não abriu',
        passos: [
          'Procure, perto da barra de endereço, o aviso de janela bloqueada e clique em “Permitir”.',
          'Clique de novo em “Entrar em contato”.',
          'Se o computador não tem o WhatsApp, ele abre no navegador: entre lendo o código com o celular.',
        ],
        obs: `Se ainda não funcionar, ligue para ${EMPRESA.telefone}.`,
        termos: 'pop-up janela bloqueada contato não funciona botão whatsapp web',
        acao: { label: 'Abrir o WhatsApp da loja', href: WHATSAPP_AJUDA },
      },
      {
        id: 'preco',
        pergunta: 'O preço e o prazo do site são os finais?',
        resumo:
          'Não. O preço do site é uma referência. Antes de fechar, confirme com a loja no WhatsApp o preço, o estoque, o prazo e o frete. A loja envia para outras cidades.',
        termos: 'frete envio entrega estoque disponibilidade valor desconto',
      },
      {
        id: 'peca',
        pergunta: 'Não sei qual peça serve no meu motor',
        passos: [
          'Clique em “Perguntar no WhatsApp”, logo abaixo.',
          'Envie o modelo do veículo ou do motor, o ano e, se tiver, uma foto da peça.',
          'Espere a loja confirmar a peça certa antes de comprar.',
        ],
        termos: 'compatível compatibilidade modelo ano veículo carro caminhão',
        acao: {
          label: 'Perguntar no WhatsApp',
          href: whatsappUrl('Olá! Preciso de ajuda para achar a peça certa. Meu motor é: '),
        },
      },
      {
        id: 'busca',
        pergunta: 'Busquei e o produto não apareceu',
        passos: [
          'Digite só uma palavra, como “pistão”. Acento não faz diferença.',
          'Se houver filtro de categoria ou de preço ligado, clique em “Limpar filtros”.',
          'Se ainda não encontrar, pergunte à loja pelo WhatsApp.',
        ],
        termos: 'pesquisa procurar vazio nenhum resultado filtro encontrar',
        acao: { label: 'Buscar no catálogo', href: '/produtos' },
      },
    ],
  },
  {
    titulo: 'Acesso e conta',
    perguntas: [
      {
        id: 'senha',
        pergunta: 'Esqueci a senha ou quero trocá-la',
        passos: [
          'Clique em “Trocar a senha”, logo abaixo, ou em “Esqueci a senha”, na tela de entrar.',
          'Digite o e-mail da conta e clique em “Enviar instruções”.',
          'Digite o código que chegou no seu e-mail e a nova senha, e clique em “Redefinir senha”.',
        ],
        obs: 'Por segurança, você sai da conta nos outros aparelhos em que estava conectado.',
        termos: 'login entrar redefinir recuperar credenciais inválidas',
        acao: { label: 'Trocar a senha', href: '/recuperar-senha' },
      },
      {
        id: 'codigo',
        pergunta: 'O código da senha não chegou ou não funciona',
        passos: [
          'Procure o e-mail na caixa de spam ou de lixo eletrônico.',
          'Confira se você digitou o mesmo e-mail do cadastro.',
          'Use sempre o código mais recente: cada novo pedido cancela o anterior, e o código vale por 2 horas.',
        ],
        termos: 'token inválido expirado e-mail spam lixo',
        acao: { label: 'Pedir outro código', href: '/recuperar-senha' },
      },
      {
        id: 'ja-cadastrado',
        pergunta: 'Aparece que o e-mail, CPF ou CNPJ já está cadastrado',
        resumo: 'Isso quer dizer que já existe uma conta com esse dado.',
        passos: [
          'Clique em “Entrar” e use o e-mail dessa conta.',
          'Se não lembrar a senha, clique em “Esqueci a senha”.',
        ],
        obs: 'Não reconhece essa conta? Escreva para a loja.',
        termos: 'criar conta duplicado existe cadastro',
        acao: { label: 'Entrar', href: '/entrar' },
      },
      {
        id: 'dados',
        pergunta: 'Quero mudar meu nome, telefone ou e-mail alternativo',
        passos: [
          'Clique no seu nome, no topo do site, para abrir “Minha conta”.',
          'Na aba “Dados”, altere o que precisar.',
          'Clique em “Salvar”.',
        ],
        obs: 'Para corrigir a razão social, escreva para a loja.',
        termos: 'atualizar editar corrigir cadastro',
        acao: { label: 'Abrir meus dados', href: '/conta?aba=dados' },
      },
      {
        id: 'documento',
        pergunta: 'Preciso corrigir o e-mail de login, o CPF, o CNPJ ou a razão social',
        resumo: 'Por segurança, esses dados não podem ser alterados pelo site.',
        passos: [
          'Clique em “Escrever para a loja”, logo abaixo.',
          'Envie a mensagem a partir do e-mail cadastrado, informando o dado correto.',
        ],
        termos: 'alterar documento login empresa',
        acao: { label: 'Escrever para a loja', href: `mailto:${EMPRESA.email}` },
      },
      {
        id: 'sair',
        pergunta: 'Como saio da conta?',
        passos: ['Clique no seu nome, no topo do site.', 'No fim da página, clique em “Sair da conta”.'],
        obs: 'Em computador compartilhado, saia sempre que terminar.',
        termos: 'logout desconectar deslogar',
        acao: { label: 'Abrir minha conta', href: '/conta' },
      },
    ],
  },
  {
    titulo: 'Favoritos e recomendações',
    perguntas: [
      {
        id: 'favoritos',
        pergunta: 'Como salvo um produto para ver depois?',
        passos: [
          'Abra o produto e clique em “Favoritar”.',
          'Para ver a lista, clique em “Favoritos”, no topo do site.',
        ],
        obs: 'Removeu um favorito sem querer? Clique em “Desfazer” no aviso que aparece.',
        termos: 'lista guardar coração removi sumiu',
        acao: { label: 'Ver favoritos', href: '/favoritos' },
      },
      {
        id: 'ordem',
        pergunta: 'Por que a ordem dos produtos muda?',
        resumo:
          'O catálogo mostra antes os produtos parecidos com os que você viu, buscou e favoritou. Os preços não mudam.',
        passos: [ABRIR_PRIVACIDADE, 'Para ver sempre a ordem geral, desligue “Cookies comportamentais”.'],
        termos: 'recomendação personalização sugestão cookies',
        acao: PRIVACIDADE_CONTA,
      },
      {
        id: 'navegador',
        pergunta: 'Aparece “Sua conta aceita, mas este navegador não”',
        resumo: 'Neste navegador, os cookies comportamentais estão desligados.',
        passos: [ABRIR_PRIVACIDADE, 'No aviso azul, clique em “Aceitar neste navegador”.'],
        termos: 'cookies aviso essenciais navegador',
        acao: PRIVACIDADE_CONTA,
      },
    ],
  },
  {
    titulo: 'Privacidade',
    perguntas: [
      {
        id: 'contato',
        pergunta: 'Não quero receber contato da loja',
        passos: [ABRIR_PRIVACIDADE, 'Desligue “Contato proativo”. A mudança vale na hora.'],
        obs: 'A loja deixa de ver seu e-mail e seu telefone. Você continua podendo chamar a loja quando quiser.',
        termos: 'parar mensagens ligação spam comercial descadastrar',
        acao: PRIVACIDADE_CONTA,
      },
      {
        id: 'personalizacao',
        pergunta: 'Não quero que minha navegação seja usada',
        passos: [ABRIR_PRIVACIDADE, 'Desligue “Cookies comportamentais”. A mudança vale na hora.'],
        obs: 'Sem conta? Clique em “Preferências de cookies”, no rodapé, e desligue a opção.',
        termos: 'rastreamento cookies histórico desativar',
        acao: PRIVACIDADE_CONTA,
      },
      {
        id: 'copia',
        pergunta: 'Quero uma cópia dos meus dados',
        passos: [
          'Clique em “Pedir por e-mail”, logo abaixo.',
          'Envie a mensagem a partir do e-mail cadastrado na conta.',
          'Aguarde a resposta: a cópia chega em até 15 dias, sem custo.',
        ],
        termos: 'exportar baixar lgpd portabilidade acesso',
        acao: { label: 'Pedir por e-mail', href: EMAIL_DADOS },
      },
      {
        id: 'excluir',
        pergunta: 'Quero excluir minha conta',
        passos: [ABRIR_PRIVACIDADE, 'Clique em “Solicitar exclusão da conta” e confirme em “Excluir conta”.'],
        obs: 'A exclusão é imediata e não pode ser desfeita.',
        termos: 'apagar deletar remover cancelar lgpd',
        acao: PRIVACIDADE_CONTA,
      },
    ],
  },
]

const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

/** Todas as palavras da busca têm de aparecer em algum texto da pergunta. */
function casa(p: Pergunta, palavras: string[]): boolean {
  const texto = semAcento([p.pergunta, p.resumo, ...(p.passos ?? []), p.obs, p.termos].filter(Boolean).join(' '))
  return palavras.every((palavra) => texto.includes(palavra))
}

function Acao({ id, label, href }: { id: string; label: string; href: string }) {
  const externo = href.startsWith('https:')
  return (
    <Button id={`ajuda-${id}-acao`} href={href} {...(externo && { target: '_blank', rel: 'noopener noreferrer' })}>
      {label}
    </Button>
  )
}

function Resposta({ p }: { p: Pergunta }) {
  return (
    <Typography>
      {p.resumo && <Paragraph>{p.resumo}</Paragraph>}
      {p.passos && (
        <ol>
          {p.passos.map((passo) => (
            <li key={passo}>{passo}</li>
          ))}
        </ol>
      )}
      {p.obs && <Paragraph type="secondary">{p.obs}</Paragraph>}
      {p.acao && <Acao id={p.id} {...p.acao} />}
    </Typography>
  )
}

export function Ajuda() {
  const [busca, setBusca] = useState('')
  const grupos = useMemo(() => {
    const palavras = semAcento(busca).split(/\s+/).filter(Boolean)
    return GRUPOS.map((g) => ({ ...g, perguntas: g.perguntas.filter((p) => casa(p, palavras)) })).filter(
      (g) => g.perguntas.length > 0,
    )
  }, [busca])

  return (
    <Flex vertical gap="large">
      <Input.Search
        id="ajuda-busca"
        aria-label="Buscar na ajuda"
        placeholder="Digite sua dúvida, por exemplo: senha"
        allowClear
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {grupos.length === 0 && (
        <Empty description="Nenhuma resposta encontrada. Tente outra palavra ou fale com a loja pelos canais abaixo.">
          <Button id="ajuda-limpar" variant="link" onClick={() => setBusca('')}>
            Ver todas as perguntas
          </Button>
        </Empty>
      )}

      {grupos.map((g) => (
        <section key={g.titulo} aria-label={g.titulo}>
          <Title level={2} style={{ marginTop: 0 }}>
            {g.titulo}
          </Title>
          <Collapse
            items={g.perguntas.map((p) => ({ key: p.id, label: p.pergunta, children: <Resposta p={p} /> }))}
          />
        </section>
      ))}

      <Card>
        <Flex vertical gap="middle">
          <Title level={2} style={{ margin: 0 }}>
            Ainda precisa de ajuda?
          </Title>
          <Text type="secondary">
            Fale com a loja de {EMPRESA.horario.dias.toLowerCase()}, {EMPRESA.horario.horas}.
          </Text>
          <Flex gap="small" wrap="wrap">
            <Button
              id="ajuda-whatsapp"
              color="primary"
              icon={<WhatsAppOutlined />}
              href={WHATSAPP_AJUDA}
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp
            </Button>
            <Button id="ajuda-telefone" icon={<PhoneOutlined />} href={EMPRESA.telefoneHref}>
              {EMPRESA.telefone}
            </Button>
            <Button id="ajuda-email" icon={<MailOutlined />} href={`mailto:${EMPRESA.email}`}>
              {EMPRESA.email}
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  )
}
