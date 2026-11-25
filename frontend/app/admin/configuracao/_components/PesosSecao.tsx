'use client'

import type { ReactNode } from 'react'
import { Flex, Slider, Tooltip, Typography } from '@/components/ui'
import { EVENTOS_SCORING, ORDEM_EVENTOS, descricaoCompleta, formatPontos, pontosPorAcao } from '@/lib/scoring'
import { palette } from '@/lib/theme/tokens'
import type { PesoMetrica, TipoMetrica } from '@/lib/types'
import { HelpTitle } from '../../_components/HelpTitle'

const PESO_MAX_SLIDER = 3

type OnChange = (tipo: TipoMetrica, peso: number) => void

export function rotuloPontos(tipo: TipoMetrica, pontos: number): string {
  const e = EVENTOS_SCORING[tipo]
  const p = formatPontos(pontos)
  if (e.penalidade) return `−${p} pts`
  if (e.proporcional) return `até +${p} pts`
  return `+${p} pts`
}

function explicacaoPontos(tipo: TipoMetrica, pontos: number): string {
  const e = EVENTOS_SCORING[tipo]
  const p = formatPontos(pontos)
  if (e.penalidade) return `Cada vez que o cliente faz isso, a nota do produto cai ${p} pontos (de 100).`
  if (e.alvo === 'categoria') return `Cada vez que o cliente filtra por uma categoria, a nota daquela categoria sobe ${p} pontos (de 100).`
  return `Cada vez que o cliente faz isso, a nota do produto sobe ${e.proporcional ? 'até ' : ''}${p} pontos (de 100).`
}

function pesoTexto(v: number): string {
  return `peso ${String(v).replace('.', ',')}`
}

/** Uma linha de ajuste: rótulo · slider · valor. Em tela estreita, o slider desce para a linha de baixo. */
export function LinhaSlider({
  id,
  rotulo,
  nome,
  min = 0,
  max,
  step,
  value,
  formatar,
  textoDoValor = formatar,
  valor,
  onChange,
}: {
  id?: string
  rotulo: ReactNode
  /** Nome do controle para leitor de tela. */
  nome: string
  min?: number
  max: number
  step: number
  value: number
  /** Dica do slider. */
  formatar: (v: number) => string
  /** Valor lido pelo leitor de tela, quando difere da dica. */
  textoDoValor?: (v: number) => string
  valor: ReactNode
  onChange: (v: number) => void
}) {
  return (
    <Flex id={id} align="center" gap="4px 12px" wrap>
      <Flex align="center" gap={8} style={{ flex: '0 1 172px' }}>
        {rotulo}
      </Flex>
      <Slider
        ariaLabelForHandle={nome}
        ariaValueTextFormatterForHandle={textoDoValor}
        style={{ flex: 1, minWidth: 80, margin: '0 4px' }}
        min={min}
        max={max}
        step={step}
        value={value}
        tooltip={{ formatter: (v) => formatar(v ?? 0) }}
        onChange={onChange}
      />
      <Flex justify="flex-end" style={{ flex: '0 0 88px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {valor}
      </Flex>
    </Flex>
  )
}

/** Linha de peso de uma ação: cor + nome (tooltip), se não vier outro rótulo, e pontos por ação. */
export function LinhaPeso({
  tipo,
  pesos,
  rotulo,
  onChange,
}: {
  tipo: TipoMetrica
  pesos: PesoMetrica[]
  rotulo?: ReactNode
  onChange: OnChange
}) {
  const e = EVENTOS_SCORING[tipo]
  const peso = pesos.find((p) => p.tipoEvento === tipo)?.peso ?? 0
  const pontos = pontosPorAcao(pesos)[tipo] ?? 0
  return (
    <LinhaSlider
      id={`admin-peso-${tipo}`}
      rotulo={
        rotulo ?? (
          <>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: e.cor }} />
            <Tooltip title={descricaoCompleta(tipo)}>
              <span style={{ borderBottom: `1px dotted ${palette.neutral[400]}`, cursor: 'help' }}>{e.nome}</span>
            </Tooltip>
          </>
        )
      }
      nome={`Peso de ${e.nome}`}
      max={Math.max(PESO_MAX_SLIDER, peso)}
      step={0.05}
      value={peso}
      formatar={pesoTexto}
      textoDoValor={(v) => `${pesoTexto(v)}, ${rotuloPontos(tipo, pontos)}`}
      valor={
        <Tooltip title={explicacaoPontos(tipo, pontos)}>
          <Typography.Text strong style={{ color: e.penalidade ? palette.error[600] : undefined }}>
            {rotuloPontos(tipo, pontos)}
          </Typography.Text>
        </Tooltip>
      }
      onChange={(v) => onChange(tipo, v)}
    />
  )
}

/** Barra com a fatia de cada ação no peso total (equivale à divisão dos pontos). */
export function ComposicaoNota({ pesos }: { pesos: PesoMetrica[] }) {
  const pontos = pontosPorAcao(pesos)
  const fatias = ORDEM_EVENTOS.filter((t) => EVENTOS_SCORING[t].alvo !== 'categoria' && !EVENTOS_SCORING[t].foraDoDivisor)
    .map((t) => ({ tipo: t, pct: pontos[t] ?? 0, peso: pesos.find((p) => p.tipoEvento === t)?.peso ?? 0 }))
    .filter((f) => f.peso > 0)
  return (
    <Flex
      role="img"
      aria-label={`Composição da nota: ${fatias.map((f) => `${EVENTOS_SCORING[f.tipo].nome} ${Math.round(f.pct)}%`).join(', ')}`}
      style={{ height: 10, borderRadius: 5, overflow: 'hidden', background: palette.neutral[100] }}
    >
      {fatias.map((f) => (
        <Tooltip key={f.tipo} title={`${EVENTOS_SCORING[f.tipo].nome}: ${Math.round(f.pct)}% do peso total`}>
          <div style={{ width: `${f.pct}%`, background: EVENTOS_SCORING[f.tipo].cor, transition: 'width .2s' }} />
        </Tooltip>
      ))}
    </Flex>
  )
}

/** Aba "Ações do cliente": pesos das ações de produto + a barra de composição (o visual desta aba). */
export function PesosSecao({ pesos, onChange }: { pesos: PesoMetrica[]; onChange: OnChange }) {
  const tipos = ORDEM_EVENTOS.filter(
    (t) => EVENTOS_SCORING[t].alvo !== 'categoria' && pesos.some((p) => p.tipoEvento === t),
  )
  return (
    <Flex vertical gap={14}>
      <Flex vertical gap={8}>
        <HelpTitle
          label="Quanto cada ação pesa na nota do produto"
          help={
            <div>
              <p style={{ margin: '4px 0' }}>
                Cada ação do cliente em um produto soma pontos na nota de interesse daquele produto (0 a 100). O nível do
                cliente (Quente, Morno, Frio) vem da maior nota entre os produtos.
              </p>
              <p style={{ margin: '4px 0' }}>
                Os pesos são comparados entre si: aumentar um faz os outros valerem um pouco menos. A barra mostra a fatia
                de cada ação, na mesma cor da linha; os pontos à direita mostram quanto uma única ação vale. “Comprar” e
                “Voltar ao produto” somam à parte: não aparecem na barra e não mudam o valor das outras.
              </p>
            </div>
          }
        />
        <ComposicaoNota pesos={pesos} />
      </Flex>
      {tipos.map((t) => (
        <LinhaPeso key={t} tipo={t} pesos={pesos} onChange={onChange} />
      ))}
    </Flex>
  )
}
