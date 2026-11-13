'use client'

import { Flex, Slider, Tooltip, Typography } from '@/components/ui'
import { EVENTOS_SCORING, ORDEM_EVENTOS, formatPontos, pontosPorAcao } from '@/lib/scoring'
import { palette } from '@/lib/theme/tokens'
import type { PesoMetrica, TipoEvento } from '@/lib/types'
import { HelpTitle } from '../../_components/HelpTitle'

const PESO_MAX_SLIDER = 3

type OnChange = (tipo: TipoEvento, peso: number) => void

function rotuloPontos(tipo: TipoEvento, pontos: number): string {
  const e = EVENTOS_SCORING[tipo]
  const p = formatPontos(pontos)
  if (e.penalidade) return `−${p} pts`
  if (e.proporcional) return `até +${p} pts`
  return `+${p} pts`
}

function explicacaoPontos(tipo: TipoEvento, pontos: number): string {
  const e = EVENTOS_SCORING[tipo]
  const p = formatPontos(pontos)
  if (e.penalidade) return `Cada vez que o cliente faz isso, a nota do produto cai ${p} pontos (de 100).`
  if (e.alvo === 'categoria') return `Cada vez que o cliente filtra por uma categoria, a nota daquela categoria sobe ${p} pontos (de 100).`
  return `Cada vez que o cliente faz isso, a nota do produto sobe ${e.proporcional ? 'até ' : ''}${p} pontos (de 100).`
}

/** Uma linha: cor + nome (tooltip) · slider · pontos por ação. */
export function LinhaPeso({ tipo, pesos, onChange }: { tipo: TipoEvento; pesos: PesoMetrica[]; onChange: OnChange }) {
  const e = EVENTOS_SCORING[tipo]
  const peso = pesos.find((p) => p.tipoEvento === tipo)?.peso ?? 0
  const pontos = pontosPorAcao(pesos)[tipo] ?? 0
  return (
    <Flex id={`admin-peso-${tipo}`} align="center" gap={12}>
      <Flex align="center" gap={8} style={{ flex: '0 0 172px', whiteSpace: 'nowrap' }}>
        <span aria-hidden style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, background: e.cor }} />
        <Tooltip title={e.descricao}>
          <span style={{ borderBottom: `1px dotted ${palette.neutral[400]}`, cursor: 'help' }}>{e.nome}</span>
        </Tooltip>
      </Flex>
      <Slider
        aria-label={`Peso de ${e.nome}`}
        style={{ flex: 1, minWidth: 80, margin: '0 4px' }}
        min={0}
        max={Math.max(PESO_MAX_SLIDER, peso)}
        step={0.05}
        value={peso}
        tooltip={{ formatter: (v) => `peso ${String(v).replace('.', ',')}` }}
        onChange={(v: number) => onChange(tipo, v)}
      />
      <Tooltip title={explicacaoPontos(tipo, pontos)}>
        <Typography.Text
          strong
          style={{
            flex: '0 0 88px',
            textAlign: 'right',
            whiteSpace: 'nowrap',
            color: e.penalidade ? palette.error[600] : undefined,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {rotuloPontos(tipo, pontos)}
        </Typography.Text>
      </Tooltip>
    </Flex>
  )
}

/** Barra com a fatia de cada ação no peso total (equivale à divisão dos pontos). */
function ComposicaoNota({ pesos }: { pesos: PesoMetrica[] }) {
  const pontos = pontosPorAcao(pesos)
  const fatias = ORDEM_EVENTOS.filter((t) => EVENTOS_SCORING[t].alvo !== 'categoria')
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
                de cada ação, na mesma cor da linha; os pontos à direita mostram quanto uma única ação vale.
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
