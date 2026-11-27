'use client'

import Link from 'next/link'
import { Flex, Tag, Tooltip, Typography } from '@/components/ui'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { nivelDoScore } from '@/lib/nivelInteresse'
import { NivelInteresseIcon } from './NivelInteresseIcon'

/** Texto longo de tabela: no máximo `linhas`; a dica com o texto inteiro aparece quando ele não cabe. */
export function TextoCelula({
  texto,
  href,
  linhas = 1,
  principal = false,
  type,
}: {
  texto: string | null | undefined
  href?: string
  linhas?: number
  /** Coluna que identifica a linha: fonte do corpo, em vez da de apoio. */
  principal?: boolean
  type?: 'secondary'
}) {
  if (!texto) return '—'
  return (
    <Typography.Paragraph
      type={type}
      ellipsis={{ rows: linhas, tooltip: texto }}
      style={{
        margin: 0,
        fontSize: principal ? 'var(--font-size-lg)' : 'var(--font-size-base)',
        // Duas linhas de 14px com a altura normal engrossariam a linha da tabela.
        lineHeight: principal && linhas > 1 ? 'var(--line-height-tight)' : undefined,
      }}
    >
      {href ? <Link href={href}>{texto}</Link> : texto}
    </Typography.Paragraph>
  )
}

/** Nota máxima do cliente com o ícone do nível de interesse. */
export function NotaCelula({ nota }: { nota: number | null }) {
  return (
    <Flex gap={8} align="center">
      <NivelInteresseIcon nivel={nivelDoScore(nota)} />
      <span>{nota ?? '—'}</span>
    </Flex>
  )
}

/** Dado que o cliente desligou em /conta: diferente de "—", que é não ter o dado. */
export function NaoCompartilhado() {
  return (
    <Tooltip title="O cliente optou por não compartilhar">
      <Typography.Text type="secondary" style={{ fontSize: 'var(--font-size-base)' }}>
        Oculto
      </Typography.Text>
    </Tooltip>
  )
}

export function AtivoTag({ ativo }: { ativo: boolean }) {
  return <Tag color={ativo ? 'success' : 'default'}>{ativo ? 'Ativo' : 'Inativo'}</Tag>
}

/** Só a data, para caber em uma linha; a hora fica na dica. */
export function DataCelula({ data }: { data: string | null | undefined }) {
  return data ? <Tooltip title={formatDateTime(data)}>{formatDate(data)}</Tooltip> : '—'
}
