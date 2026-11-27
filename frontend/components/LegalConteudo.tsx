'use client'

import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { EMPRESA, VERSAO_TERMOS } from '@/lib/config'
import { Typography } from '@/components/ui'

const { Title, Paragraph, Text, Link: TextLink } = Typography

/**
 * Fonte única dos Termos e da Política: /termos, /privacidade e o modal do cadastro só exibem isto.
 * Formato ABNT (NBR 6024): seções e itens numerados pelo componente; alíneas a), b)... com a pontuação gerada.
 * Mudou o conteúdo? Suba VERSAO_TERMOS (lib/config.ts e ConsentimentoLgpd.java) e a data.
 */
interface ItemLegal {
  texto: ReactNode
  /** Sem pontuação final: o componente põe ";" e "." na última. */
  alineas?: ReactNode[]
}

interface SecaoLegal {
  /** Âncora da seção; não muda com a numeração. */
  id: string
  titulo: string
  itens: ItemLegal[]
}

export interface DocumentoLegalDados {
  id: 'termos' | 'privacidade'
  titulo: string
  resumo: string[]
  secoes: SecaoLegal[]
}

export const LEGAL_ATUALIZACAO = `Versão ${VERSAO_TERMOS} · atualizada em 25 de novembro de 2026`

const Email = () => <TextLink href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</TextLink>

export const PRIVACIDADE: DocumentoLegalDados = {
  id: 'privacidade',
  titulo: 'Política de Privacidade',
  resumo: [
    'Usamos seus dados para manter sua conta, atender você e mostrar produtos úteis.',
    'Não vendemos seus dados.',
    'Personalização e contato comercial se desligam quando você quiser.',
    'Você pode acessar, corrigir, copiar ou excluir seus dados sem custo.',
  ],
  secoes: [
    {
      id: 'quem-somos',
      titulo: 'Controladora',
      itens: [
        {
          texto: (
            <>
              A {EMPRESA.nome}, com sede na {EMPRESA.endereco}, doravante Controladora, é responsável pelo tratamento
              dos dados pessoais coletados neste sítio, nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de
              Dados Pessoais – LGPD).
            </>
          ),
        },
        {
          texto: (
            <>
              As solicitações relativas a dados pessoais devem ser enviadas ao canal de atendimento ao titular: <Email />.
            </>
          ),
        },
      ],
    },
    {
      id: 'dados',
      titulo: 'Dados tratados',
      itens: [
        {
          texto: 'São tratados os seguintes dados pessoais:',
          alineas: [
            'cadastrais: nome ou razão social, CPF ou CNPJ, e-mail e senha; telefone, e-mail alternativo e idade, quando informados',
            'de uso do catálogo: produtos visualizados, tempo e rolagem na página, buscas, filtros, favoritos e acionamentos do botão “Entrar em contato”',
            'de relacionamento: compras registradas pela Controladora e opções de privacidade do Titular',
            'técnicos: tipo de navegador e dados de sessão, necessários ao funcionamento e à segurança do sítio',
          ],
        },
        { texto: 'Não são tratados dados pessoais sensíveis nem dados de meios de pagamento.' },
      ],
    },
    {
      id: 'finalidades',
      titulo: 'Finalidades e bases legais',
      itens: [
        {
          texto: 'O tratamento tem as seguintes finalidades e bases legais:',
          alineas: [
            'manutenção da conta e atendimento ao Titular, por execução de contrato ou de procedimentos preliminares (art. 7º, V)',
            'personalização do catálogo para usuários com conta e apresentação, à equipe da Controladora, de resumo dos interesses do Titular, por legítimo interesse (art. 7º, IX)',
            'contato comercial sobre produtos e serviços, por legítimo interesse (art. 7º, IX)',
            'personalização para usuários sem conta e associação desse histórico à conta criada posteriormente, mediante consentimento (art. 7º, I)',
            'segurança e prevenção a fraudes, por legítimo interesse (art. 7º, IX)',
            'cumprimento de obrigação legal e exercício regular de direitos (art. 7º, II e VI)',
          ],
        },
        { texto: 'A personalização não altera preços nem restringe o acesso a produtos.' },
      ],
    },
    {
      id: 'escolhas',
      titulo: 'Opções do Titular',
      itens: [
        {
          texto: 'Na criação da conta, permanecem ativas as seguintes opções:',
          alineas: [
            'cookies comportamentais: uso da navegação no catálogo para ordenar os produtos e orientar o atendimento',
            'contato proativo: contato da equipe da Controladora por WhatsApp, telefone ou e-mail sobre produtos e serviços de interesse do Titular',
          ],
        },
        {
          texto:
            'O Titular pode desativar cada opção a qualquer tempo, em Minha conta > Privacidade, sem custo e sem prejuízo do acesso ao catálogo.',
        },
        {
          texto:
            'Desativados os cookies comportamentais, cessam o registro da navegação e a personalização, e a Controladora deixa de visualizar os interesses do Titular. Desativado o contato proativo, a Controladora deixa de visualizar o e-mail, o telefone e o documento do Titular na relação de clientes.',
        },
        { texto: 'O usuário sem conta exerce sua opção no aviso de cookies ou nesta página.' },
      ],
    },
    {
      id: 'cookies',
      titulo: 'Cookies',
      itens: [
        {
          texto: 'O sítio utiliza cookies e armazenamento local do navegador, classificados em:',
          alineas: [
            'essenciais: sempre ativos, destinados à autenticação, à segurança e ao registro das opções do usuário',
            'comportamentais: destinados às recomendações; a recusa no aviso de cookies impede o registro da navegação naquele navegador, ainda que o usuário tenha conta',
          ],
        },
        { texto: 'Não são utilizados cookies de publicidade de terceiros.' },
      ],
    },
    {
      id: 'compartilhamento',
      titulo: 'Compartilhamento',
      itens: [
        {
          texto: 'Os dados não são comercializados. O compartilhamento limita-se:',
          alineas: [
            'a fornecedores de tecnologia, como hospedagem e envio de e-mails, que atuam conforme as instruções da Controladora',
            'a autoridades, quando exigido por lei ou por ordem judicial',
          ],
        },
        {
          texto:
            'Ao acionar “Entrar em contato”, a conversa prossegue no WhatsApp, sujeita às regras de privacidade desse serviço.',
        },
        { texto: 'Eventual transferência internacional de dados observará os arts. 33 a 36 da LGPD.' },
      ],
    },
    {
      id: 'prazo',
      titulo: 'Retenção',
      itens: [
        {
          texto: 'Os dados são mantidos pelos seguintes prazos:',
          alineas: [
            'dados da conta: enquanto ela existir; na exclusão, os dados identificadores são eliminados, podendo ser mantidos registros sem identificação e os exigidos por lei',
            'identificador de navegação sem conta: 30 dias',
            'opção de cookies: 12 meses, após os quais é solicitada novamente',
          ],
        },
      ],
    },
    {
      id: 'seguranca',
      titulo: 'Segurança',
      itens: [
        {
          texto:
            'O acesso aos dados é restrito à equipe autorizada, e a senha é armazenada de forma cifrada e irreversível.',
        },
        {
          texto:
            'Incidente de segurança que possa acarretar risco ou dano relevante será comunicado ao Titular e à Autoridade Nacional de Proteção de Dados (ANPD).',
        },
      ],
    },
    {
      id: 'direitos',
      titulo: 'Direitos do Titular',
      itens: [
        {
          texto: 'Nos termos do art. 18 da LGPD, o Titular pode, gratuitamente:',
          alineas: [
            'confirmar a existência de tratamento e acessar seus dados',
            'corrigir dados incompletos, inexatos ou desatualizados',
            'obter a portabilidade dos dados',
            'solicitar a anonimização, o bloqueio ou a eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei',
            'eliminar os dados tratados com consentimento e excluir a conta',
            'conhecer as entidades com as quais os dados são compartilhados',
            'revogar o consentimento, ser informado das consequências da recusa e opor-se ao tratamento fundado em legítimo interesse',
            'solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado (art. 20)',
          ],
        },
        {
          texto: (
            <>
              Os direitos podem ser exercidos em Minha conta ou pelo e-mail <Email />, a partir do endereço cadastrado,
              com resposta em até 15 dias.
            </>
          ),
        },
        { texto: 'O Titular pode, ainda, peticionar à ANPD e aos órgãos de defesa do consumidor.' },
      ],
    },
    {
      id: 'idade',
      titulo: 'Menores de idade',
      itens: [
        {
          texto:
            'As contas destinam-se a maiores de 18 anos e a pessoas jurídicas. Dados de menores eventualmente identificados serão eliminados.',
        },
      ],
    },
    {
      id: 'atualizacoes',
      titulo: 'Alterações',
      itens: [
        {
          texto:
            'Esta Política pode ser alterada a qualquer tempo, prevalecendo a versão publicada nesta página, com a respectiva data.',
        },
        {
          texto:
            'Alteração de finalidade será informada com destaque, assegurado ao Titular o direito de recusar o tratamento que dependa de consentimento.',
        },
      ],
    },
  ],
}

export const TERMOS: DocumentoLegalDados = {
  id: 'termos',
  titulo: 'Termos de Uso',
  resumo: [
    'O catálogo é gratuito e a negociação acontece no atendimento da loja.',
    'Preços e disponibilidade são confirmados antes da compra.',
    'Você cuida da sua senha e dos dados que informa.',
    'Pode encerrar a conta quando quiser.',
  ],
  secoes: [
    {
      id: 'catalogo',
      titulo: 'Objeto',
      itens: [
        {
          texto: `Estes Termos regulam o uso do catálogo eletrônico da ${EMPRESA.nome}, doravante Loja, disponível neste sítio.`,
        },
        {
          texto:
            'O catálogo é gratuito e não dispõe de carrinho nem de pagamento. O botão “Entrar em contato” direciona o Usuário ao WhatsApp da Loja, onde a negociação é realizada.',
        },
      ],
    },
    {
      id: 'conta',
      titulo: 'Conta',
      itens: [
        { texto: 'A conta destina-se a maiores de 18 anos e a pessoas jurídicas, por meio de seus representantes.' },
        {
          texto:
            'O Usuário responde pela veracidade dos dados informados e pelo sigilo de sua senha, devendo alterá-la e comunicar a Loja em caso de uso indevido.',
        },
      ],
    },
    {
      id: 'precos',
      titulo: 'Preços e disponibilidade',
      itens: [
        {
          texto:
            'Preços, prazos, fretes e estoque são informativos, podem ser alterados sem aviso e são confirmados no atendimento, antes da compra.',
        },
        {
          texto:
            'As imagens são ilustrativas. A compatibilidade da peça com o motor deve ser confirmada no atendimento.',
        },
      ],
    },
    {
      id: 'recomendacoes',
      titulo: 'Recomendações e contato',
      itens: [
        {
          texto: (
            <>
              A conta é criada com recomendações personalizadas e contato comercial ativos, que podem ser desativados a
              qualquer tempo em Minha conta &gt; Privacidade, conforme a{' '}
              <Link href="/privacidade" target="_blank">
                Política de Privacidade
              </Link>
              .
            </>
          ),
        },
      ],
    },
    {
      id: 'uso',
      titulo: 'Uso adequado',
      itens: [
        {
          texto: 'É vedado ao Usuário:',
          alineas: [
            'utilizar o sítio para fins ilícitos',
            'informar dados de terceiros sem autorização',
            'tentar acessar áreas restritas ou comprometer o funcionamento do sítio',
            'extrair o conteúdo do catálogo por meios automatizados',
          ],
        },
      ],
    },
    {
      id: 'propriedade',
      titulo: 'Propriedade intelectual',
      itens: [
        {
          texto:
            'Marcas, textos, imagens e o próprio sítio pertencem à Loja ou a seus licenciantes, permitidos o compartilhamento de links e a consulta para uso próprio.',
        },
      ],
    },
    {
      id: 'responsabilidades',
      titulo: 'Responsabilidade',
      itens: [
        {
          texto:
            'A Loja empenha-se em manter o sítio correto e disponível, não respondendo por interrupções decorrentes de manutenção ou de serviços de terceiros, como provedores de internet e o WhatsApp.',
        },
        { texto: 'Nada nestes Termos limita os direitos assegurados pelo Código de Defesa do Consumidor.' },
      ],
    },
    {
      id: 'encerramento',
      titulo: 'Encerramento',
      itens: [
        { texto: 'O Usuário pode excluir sua conta a qualquer tempo em Minha conta > Privacidade.' },
        {
          texto:
            'A Loja pode suspender a conta que descumprir estes Termos, mediante aviso, salvo em caso de fraude ou de risco à segurança.',
        },
      ],
    },
    {
      id: 'lei',
      titulo: 'Disposições finais e foro',
      itens: [
        { texto: 'Estes Termos podem ser alterados a qualquer tempo, prevalecendo a versão publicada nesta página.' },
        {
          texto:
            'Aplica-se a legislação brasileira. Fica eleito o foro do domicílio do consumidor e, nos demais casos, o da comarca de Jaraguá do Sul, SC.',
        },
        {
          texto: (
            <>
              Dúvidas podem ser enviadas para <Email />.
            </>
          ),
        },
      ],
    },
  ],
}

interface DocumentoLegalProps {
  doc: DocumentoLegalDados
  /** Nível das seções: sempre um abaixo do título do documento onde ele aparece. */
  nivel?: 2 | 3 | 4
  /** Modal do cadastro: fonte de apoio (12px) e espaçamento menor. */
  compacto?: boolean
  /** Controles que só fazem sentido na página, por id de seção. */
  extras?: Record<string, ReactNode>
}

export const idDaSecao = (doc: DocumentoLegalDados, secao: string) => `${doc.id}-${secao}`

/** "1 Objeto": o número da seção vem da ordem, para nunca ficar fora de sequência. */
export const tituloNumerado = (doc: DocumentoLegalDados, secao: string) => {
  const i = doc.secoes.findIndex((s) => s.id === secao)
  return `${i + 1} ${doc.secoes[i].titulo}`
}

export function DocumentoLegal({ doc, nivel = 2, compacto = false, extras }: DocumentoLegalProps) {
  const fonte: CSSProperties = compacto
    ? { fontSize: 'var(--font-size-base)', lineHeight: 'var(--line-height-tight)' }
    : {}
  const item: CSSProperties = {
    ...fonte,
    textAlign: 'justify',
    marginBottom: compacto ? 'var(--space-1)' : 'var(--space-2)',
  }
  return doc.secoes.map((s, i) => {
    const id = idDaSecao(doc, s.id)
    return (
      <section key={id} id={id} aria-labelledby={`${id}-titulo`}>
        <Title
          level={nivel}
          id={`${id}-titulo`}
          style={{
            ...fonte,
            textTransform: 'uppercase',
            marginTop: compacto ? 'var(--space-3)' : undefined,
            marginBottom: compacto ? 'var(--space-1)' : undefined,
          }}
        >
          {i + 1} {s.titulo}
        </Title>
        {s.itens.map((it, j) => (
          <div key={j}>
            <Paragraph style={item}>
              <Text strong style={fonte}>
                {i + 1}.{j + 1}
              </Text>{' '}
              {it.texto}
            </Paragraph>
            {it.alineas?.map((a, k, todas) => (
              <Paragraph key={k} style={{ ...item, paddingLeft: 'var(--space-4)' }}>
                {String.fromCharCode(97 + k)}) {a}
                {k === todas.length - 1 ? '.' : ';'}
              </Paragraph>
            ))}
          </div>
        ))}
        {extras?.[s.id]}
      </section>
    )
  })
}

interface DocumentoLegalCompactoProps {
  doc: DocumentoLegalDados
  /** h1 na página /privacidade, h2 na aba da conta, h3 no modal do cadastro. */
  titulo: 1 | 2 | 3
  extras?: Record<string, ReactNode>
}

/** Formato do modal do cadastro: título centralizado, versão e texto compacto. */
export function DocumentoLegalCompacto({ doc, titulo, extras }: DocumentoLegalCompactoProps) {
  const tituloId = `${doc.id}-compacto-titulo`
  return (
    <section aria-labelledby={tituloId}>
      <Title
        level={titulo}
        id={tituloId}
        style={{
          fontSize: 'var(--font-size-lg)',
          textAlign: 'center',
          textTransform: 'uppercase',
          margin: 'var(--space-4) 0 0',
        }}
      >
        {doc.titulo}
      </Title>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 'var(--font-size-base)' }}>
        {LEGAL_ATUALIZACAO}
      </Text>
      <DocumentoLegal doc={doc} nivel={(titulo + 1) as 2 | 3 | 4} compacto extras={extras} />
    </section>
  )
}
