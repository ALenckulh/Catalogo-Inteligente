'use client'

import { ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { Divider, Empty, Flex, Tooltip, Typography } from '@/components/ui'
import { formatDateTime } from '@/lib/formatters'
import { palette } from '@/lib/theme/tokens'
import type { SimulacaoMetricas, SimulacaoPrecisao } from '@/lib/types'

type Chave = 'precisaoQuentes' | 'recallQuentes' | 'auc' | 'acertoTop3'

const METRICAS: {
  chave: Chave
  titulo: string
  help: string
  frase: (v: number | null) => string
}[] = [
  {
    chave: 'precisaoQuentes',
    titulo: 'Acerto dos Quentes',
    help: 'Dos clientes que o sistema marcaria como Quente, quantos realmente entraram em contato ou compraram depois. Alto = poucos “alarmes falsos”.',
    frase: (v) =>
      v == null
        ? 'Ninguém seria marcado como Quente no período testado.'
        : `De cada 10 marcados como Quente, ${Math.round(v * 10)} converteram depois.`,
  },
  {
    chave: 'recallQuentes',
    titulo: 'Interessados encontrados',
    help: 'Dos clientes que entraram em contato ou compraram, quantos já estavam marcados como Quente antes. Alto = poucos interessados passando despercebidos.',
    frase: (v) => (v == null ? 'Sem conversões no período testado.' : `${pct(v)} dos que converteram estavam como Quente.`),
  },
  {
    chave: 'auc',
    titulo: 'Qualidade da ordenação',
    help: 'Pegando ao acaso um cliente que converteu e um que não converteu, a chance de quem converteu ter a nota maior. 50% é o mesmo que sortear; 100% é ordenação perfeita.',
    frase: (v) =>
      v == null
        ? 'É preciso ter quem converteu e quem não converteu para medir.'
        : `Em ${pct(v)} das vezes, quem converteu tinha nota maior (50% = sorte).`,
  },
  {
    chave: 'acertoTop3',
    titulo: 'Acerto da recomendação',
    help: 'Quando um cliente converteu em um produto, se esse produto estava entre os 3 de maior nota dele — ou seja, entre os primeiros que o catálogo mostraria.',
    frase: (v) =>
      v == null
        ? 'Nenhuma conversão ligada a um produto no período testado.'
        : `Em ${pct(v)} das conversões, o produto estava entre os 3 primeiros recomendados.`,
  },
]

function pct(v: number | null): string {
  return v == null ? '—' : `${Math.round(v * 100)}%`
}

function Seta({ de, para }: { de: number | null; para: number | null }) {
  if (de == null || para == null) {
    return <ArrowRightOutlined style={{ color: palette.neutral[500], fontSize: 11 }} aria-hidden />
  }
  const delta = Math.round((para - de) * 100)
  if (delta === 0) return <ArrowRightOutlined style={{ color: palette.neutral[500], fontSize: 11 }} aria-label="igual" />
  const melhor = delta > 0
  return (
    <Tooltip title={`${Math.abs(delta)} pontos percentuais ${melhor ? 'a mais' : 'a menos'}`}>
      {melhor ? (
        <ArrowUpOutlined style={{ color: palette.success[700], fontSize: 12 }} aria-label="melhor" />
      ) : (
        <ArrowDownOutlined style={{ color: palette.error[600], fontSize: 12 }} aria-label="pior" />
      )}
    </Tooltip>
  )
}

function LinhaMetrica({
  def,
  atual,
  proposta,
}: {
  def: (typeof METRICAS)[number]
  atual: SimulacaoMetricas
  proposta: SimulacaoMetricas
}) {
  const de = atual[def.chave]
  const para = proposta[def.chave]
  return (
    <Flex align="center" justify="space-between" gap={12}>
      <Tooltip
        title={
          <div>
            <p style={{ margin: '4px 0' }}>{def.help}</p>
            <p style={{ margin: '4px 0' }}>
              <strong>Com os ajustes:</strong> {def.frase(para)}
            </p>
          </div>
        }
        styles={{ root: { maxWidth: 380 } }}
      >
        <span style={{ borderBottom: `1px dotted ${palette.neutral[400]}`, cursor: 'help' }}>{def.titulo}</span>
      </Tooltip>
      <Flex align="center" gap={8} style={{ fontVariantNumeric: 'tabular-nums' }}>
        <Typography.Text type="secondary">{pct(de)}</Typography.Text>
        <Seta de={de} para={para} />
        <Typography.Text strong style={{ minWidth: 40, textAlign: 'right' }}>
          {pct(para)}
        </Typography.Text>
      </Flex>
    </Flex>
  )
}

/** Precisão em backtest: 4 métricas em linhas (hoje → com os ajustes); detalhes nos tooltips. */
export function PreviaPrecisao({ data }: { data: SimulacaoPrecisao }) {
  if (!data.corte || !data.atual || !data.proposta) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Ainda não há histórico suficiente para testar a precisão: é preciso ter ações de clientes em momentos diferentes."
      />
    )
  }
  const atual = data.atual
  const proposta = data.proposta
  const aviso =
    data.conversoes === 0
      ? 'Ninguém converteu depois da data de corte: ainda não dá para medir.'
      : data.confianca === 'BAIXA'
        ? `Poucos dados (${data.conversoes} ${data.conversoes === 1 ? 'conversão' : 'conversões'}): use só como indicação.`
        : data.confianca === 'MEDIA'
          ? `Confiança média (${data.conversoes} conversões).`
          : null

  return (
    <Flex vertical gap={10}>
      <Flex align="center" gap={6}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Notas até {formatDateTime(data.corte)}, conferindo quem converteu depois.
        </Typography.Text>
        <Tooltip
          styles={{ root: { maxWidth: 380 } }}
          title={`Teste com ${data.amostras} clientes e visitantes que já tinham atividade antes da data de corte. Ele usa o mesmo histórico que você está ajustando: ajustes finos só para melhorar estes números podem não se repetir com clientes novos.`}
        >
          <InfoCircleOutlined aria-label="Como o teste é feito" style={{ color: palette.neutral[600], fontSize: 12 }} />
        </Tooltip>
      </Flex>

      {aviso && (
        <Flex align="center" gap={6}>
          <WarningOutlined style={{ color: palette.warning[600], fontSize: 12 }} aria-hidden />
          <Typography.Text style={{ fontSize: 12 }}>{aviso}</Typography.Text>
        </Flex>
      )}

      <Flex vertical>
        {METRICAS.map((def, i) => (
          <div key={def.chave}>
            {i > 0 && <Divider style={{ margin: '8px 0' }} />}
            <LinhaMetrica def={def} atual={atual} proposta={proposta} />
          </div>
        ))}
      </Flex>
    </Flex>
  )
}
