'use client'

import { Typography } from '@/components/ui'

const { Title, Paragraph } = Typography

/** Nível das seções: 2 na página; 4 no modal, para não superar o título dele. */
interface LegalConteudoProps {
  nivel?: 2 | 4
}

export function TermosConteudo({ nivel = 2 }: LegalConteudoProps) {
  return (
    <>
      <Paragraph type="secondary">
        Documento simplificado para o Catálogo Inteligente (TCC). Versão 1.0.
      </Paragraph>
      <Title level={nivel}>Objeto</Title>
      <Paragraph>
        O sistema apresenta catálogo de produtos B2B com recomendação por scoring. Não há
        carrinho nem pagamento na plataforma — a conversão ocorre via contato externo
        (WhatsApp).
      </Paragraph>
      <Title level={nivel}>Contas</Title>
      <Paragraph>
        Usuários PF e PJ são responsáveis pela veracidade dos dados. Contas administrativas
        são provisionadas pela TI, sem auto-cadastro.
      </Paragraph>
      <Title level={nivel}>Uso aceitável</Title>
      <Paragraph>
        É vedado uso abusivo da API de eventos, scraping agressivo ou tentativa de acesso à
        área administrativa sem autorização.
      </Paragraph>
    </>
  )
}

export function PrivacidadeConteudo({ nivel = 2 }: LegalConteudoProps) {
  return (
    <>
      <Paragraph type="secondary">
        Documento simplificado para o Catálogo Inteligente (TCC). Versão 1.0.
      </Paragraph>
      <Title level={nivel}>Dados coletados</Title>
      <Paragraph>
        Dados de cadastro (e-mail, identificação PF/PJ, telefone opcional), consentimentos LGPD
        e, com autorização, eventos comportamentais para recomendação (visualizações, favoritos,
        buscas e filtros).
      </Paragraph>
      <Title level={nivel}>Finalidade</Title>
      <Paragraph>
        Operar o catálogo, autenticar usuários, personalizar recomendações e permitir contato
        comercial pelo canal WhatsApp externo à plataforma.
      </Paragraph>
      <Title level={nivel}>Direitos do titular</Title>
      <Paragraph>
        Você pode exportar ou solicitar exclusão de dados em Conta → Privacidade, além de
        revogar cookies comportamentais a qualquer momento.
      </Paragraph>
    </>
  )
}
