'use client'

import { useState } from 'react'
import { Line } from '@ant-design/charts'
import { DeleteOutlined } from '@ant-design/icons'
import { Button, Divider, Flex, InputNumber, Segmented, Select, Slider, Table, Tag, Tooltip, Typography } from '@/components/ui'
import { fatorDecaimento, lambdaDeMeiaVida, meiaVidaDeLambda } from '@/lib/scoring'
import { palette } from '@/lib/theme/tokens'
import type { Categoria, ParametroDecay, PesoMetrica, TipoEvento } from '@/lib/types'
import { HelpTitle } from '../../_components/HelpTitle'
import { LinhaPeso } from './PesosSecao'

const MEIA_VIDA_MIN = 7
const MEIA_VIDA_MAX = 180
const SERIE_HOJE = 'Hoje'
const SERIE_NOVO = 'Com o novo ajuste'

function diasDeLambda(lambda: number): number {
  return Math.round(meiaVidaDeLambda(lambda))
}

/** Marcas do slider sem quebra de linha (as das pontas ficavam em duas linhas). */
function marcas(m: Record<number, string>) {
  return Object.fromEntries(
    Object.entries(m).map(([k, label]) => [k, { label, style: { whiteSpace: 'nowrap' as const } }]),
  )
}

function boostParaPct(boost: number): number {
  return Math.round((boost - 1) * 100)
}

function pctParaBoost(pct: number): number {
  return Math.round((1 + pct / 100) * 100) / 100
}

/** λ da spec (RF25) visível, mas discreto: o controle principal é a meia-vida em dias. */
function LambdaDiscreto({ lambda }: { lambda: number }) {
  return (
    <Tooltip title="Taxa de decaimento usada no cálculo (meia-vida = ln 2 ÷ λ).">
      <Typography.Text type="secondary" style={{ fontSize: 12, cursor: 'help', fontVariantNumeric: 'tabular-nums' }}>
        λ {lambda.toFixed(5).replace('.', ',')}
      </Typography.Text>
    </Tooltip>
  )
}

// ------------------------------------------------------------ aba "Duração"

export function MeiaVidaSecao({
  lambdaSalvo,
  lambda,
  onChange,
}: {
  lambdaSalvo: number
  lambda: number
  onChange: (lambda: number) => void
}) {
  const [comConversao, setComConversao] = useState(false)
  const dias = diasDeLambda(lambda)
  const mudou = Math.abs(lambda - lambdaSalvo) > 1e-9

  const dados: { dia: number; valor: number; serie: string }[] = []
  for (let d = 0; d <= 200; d += 2) {
    dados.push({ dia: d, valor: Math.round(fatorDecaimento(d, lambdaSalvo, comConversao) * 1000) / 10, serie: SERIE_HOJE })
    if (mudou) {
      dados.push({ dia: d, valor: Math.round(fatorDecaimento(d, lambda, comConversao) * 1000) / 10, serie: SERIE_NOVO })
    }
  }

  return (
    <Flex vertical gap={8}>
      <Flex justify="space-between" align="baseline" gap={8} wrap>
        <HelpTitle
          label={
            <span>
              Uma ação perde metade do valor em <strong>{Number.isFinite(dias) ? `${dias} dias` : 'nunca'}</strong>
            </span>
          }
          help={
            <div>
              <p style={{ margin: '4px 0' }}>
                Ações antigas valem menos que as recentes. Na primeira semana a ação vale 100%; depois perde valor aos
                poucos.
              </p>
              <p style={{ margin: '4px 0' }}>
                Sem contato nem compra, depois de 3 meses o valor cai mais rápido e some aos 6 meses. Com contato ou
                compra, o interesse dura mais. Um contato nos últimos 60 dias mantém o produto com 100%.
              </p>
            </div>
          }
        />
        <LambdaDiscreto lambda={lambda} />
      </Flex>
      <Slider
        aria-label="Meia-vida em dias"
        min={MEIA_VIDA_MIN}
        max={MEIA_VIDA_MAX}
        value={Math.min(MEIA_VIDA_MAX, Math.max(MEIA_VIDA_MIN, dias))}
        marks={marcas({ 7: '1 sem.', 30: '1 mês', 90: '3 meses', 180: '6 meses' })}
        style={{ margin: '4px 28px 20px' }}
        tooltip={{ formatter: (v) => `${v} dias` }}
        onChange={(d: number) => onChange(lambdaDeMeiaVida(d))}
      />
      <Flex justify="flex-end">
        <Segmented
          size="small"
          value={comConversao ? 'com' : 'sem'}
          onChange={(v) => setComConversao(v === 'com')}
          options={[
            { label: 'Sem contato ou compra', value: 'sem' },
            { label: 'Com contato ou compra', value: 'com' },
          ]}
        />
      </Flex>
      <Line
        data={dados}
        xField="dia"
        yField="valor"
        colorField="serie"
        height={220}
        scale={{
          color: { domain: [SERIE_HOJE, SERIE_NOVO], range: [palette.neutral[500], palette.primary[600]] },
          y: { domain: [0, 100] },
        }}
        style={{
          lineWidth: 2,
          // Curva de hoje tracejada para não se confundir com a nova quando ficam próximas.
          lineDash: (d: { serie: string }[]) => (d[0]?.serie === SERIE_HOJE && mudou ? [5, 4] : [0, 0]),
        }}
        legend={mudou ? { color: { position: 'bottom', layout: { justifyContent: 'center' } } } : false}
        axis={{
          x: { title: 'Dias desde a ação' },
          y: { title: 'Valor da ação', labelFormatter: (v: number) => `${v}%` },
        }}
        tooltip={{
          title: (d: { dia: number }) => `${d.dia} dias depois`,
          items: [(d: { serie: string; valor: number }) => ({ name: d.serie, value: `${d.valor}%` })],
        }}
      />
    </Flex>
  )
}

// ---------------------------------------------------------- aba "Categorias"

type PatchDecay = Partial<Pick<ParametroDecay, 'lambda' | 'boostConversao'>>

function Bonus({ boost, onChange }: { boost: number; onChange: (boost: number) => void }) {
  const pct = boostParaPct(boost)
  return (
    <Flex vertical gap={4}>
      <HelpTitle
        label={
          <span>
            Bônus com contato ou compra recente: <strong>{pct > 0 ? `+${pct}%` : 'sem bônus'}</strong>
          </span>
        }
        help="Quando o cliente chamou no WhatsApp ou comprou algo de uma categoria nos últimos 30 dias, a nota dessa categoria é multiplicada por este bônus. Muda a categoria favorita, não o nível de interesse."
      />
      <Slider
        aria-label="Bônus de categoria em porcentagem"
        min={0}
        max={100}
        step={5}
        value={Math.min(100, Math.max(0, pct))}
        marks={marcas({ 0: 'sem bônus', 50: '+50%', 100: '+100%' })}
        style={{ margin: '4px 32px 20px' }}
        tooltip={{ formatter: (v) => `+${v}%` }}
        onChange={(v: number) => onChange(pctParaBoost(v))}
      />
    </Flex>
  )
}

function bonusTexto(boost: number): string {
  const pct = boostParaPct(boost)
  return pct > 0 ? `+${pct}%` : 'sem bônus'
}

function Referencia({ children }: { children: React.ReactNode }) {
  return (
    <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {children}
    </Typography.Text>
  )
}

function AjustesPorCategoria({
  overrides,
  global,
  idsSalvos,
  categorias,
  onChange,
  onAdicionar,
  onRemover,
}: {
  overrides: ParametroDecay[]
  /** Valores gerais, mostrados como referência em cada linha. */
  global: ParametroDecay
  /** Categorias com ajuste já gravado; as demais aparecem como "não salvo". */
  idsSalvos: Set<number>
  /** Todas as categorias do catálogo; as que já têm ajuste ficam fora da lista de adicionar. */
  categorias: Categoria[]
  onChange: (categoriaId: number, patch: PatchDecay) => void
  onAdicionar: (categoria: Categoria) => void
  onRemover: (categoriaId: number) => void
}) {
  const disponiveis = categorias.filter((c) => !overrides.some((o) => o.categoriaId === c.id))
  const diasGeral = diasDeLambda(global.lambda)
  return (
    <Flex vertical gap={8}>
      <HelpTitle
        label="Ajustes por categoria"
        help="Use quando o interesse dura mais ou menos numa categoria, ou para reduzir o bônus de bens duráveis, em que uma compra recente indica necessidade já atendida. Categorias sem ajuste usam a meia-vida da aba Duração e o bônus acima."
      />
      <Table<ParametroDecay>
        size="small"
        rowKey={(o) => String(o.categoriaId)}
        pagination={false}
        dataSource={overrides}
        locale={{ emptyText: 'Nenhuma categoria tem ajuste próprio: todas usam os valores gerais.' }}
        columns={[
          {
            title: 'Categoria',
            key: 'categoria',
            render: (_, o) => (
              <Flex align="center" gap={6} wrap>
                <Typography.Text>{o.categoriaNome ?? `Categoria ${o.categoriaId}`}</Typography.Text>
                {o.categoriaId != null && !idsSalvos.has(o.categoriaId) && (
                  <Tag style={{ fontSize: 11, lineHeight: '16px', marginInlineEnd: 0 }}>não salvo</Tag>
                )}
              </Flex>
            ),
          },
          {
            title: 'Meia-vida',
            key: 'meiaVida',
            width: 190,
            render: (_, o) => {
              const dias = diasDeLambda(o.lambda)
              return (
                <>
                  <InputNumber
                    size="small"
                    aria-label={`Meia-vida de ${o.categoriaNome}`}
                    min={MEIA_VIDA_MIN}
                    max={365}
                    value={dias}
                    suffix="dias"
                    style={{ width: 110 }}
                    onChange={(v) =>
                      o.categoriaId != null && onChange(o.categoriaId, { lambda: lambdaDeMeiaVida(Number(v ?? MEIA_VIDA_MIN)) })
                    }
                  />
                  <Tooltip title="Taxa de decaimento usada no cálculo (meia-vida = ln 2 ÷ λ).">
                    <span style={{ cursor: 'help' }}>
                      <Referencia>
                        λ {o.lambda.toFixed(5).replace('.', ',')} · {dias === diasGeral ? 'igual ao geral' : `geral ${diasGeral} dias`}
                      </Referencia>
                    </span>
                  </Tooltip>
                </>
              )
            },
          },
          {
            title: 'Bônus',
            key: 'bonus',
            width: 120,
            render: (_, o) => (
              <>
                <InputNumber<number>
                  size="small"
                  aria-label={`Bônus de ${o.categoriaNome}`}
                  min={0}
                  max={100}
                  step={5}
                  value={boostParaPct(o.boostConversao)}
                  formatter={(v) => `+${v ?? 0}%`}
                  parser={(v) => Number((v ?? '').replace(/[^0-9]/g, '') || 0)}
                  style={{ width: 84 }}
                  onChange={(v) => o.categoriaId != null && onChange(o.categoriaId, { boostConversao: pctParaBoost(Number(v ?? 0)) })}
                />
                <Referencia>
                  {o.boostConversao === global.boostConversao ? 'igual ao geral' : `geral: ${bonusTexto(global.boostConversao)}`}
                </Referencia>
              </>
            ),
          },
          {
            key: 'remover',
            width: 40,
            render: (_, o) => (
              <Button
                id={`admin-config-override-${o.categoriaId}-remover`}
                size="small"
                variant="text"
                color="danger"
                icon={<DeleteOutlined />}
                tooltip="Remover ajuste: a categoria volta a usar os valores gerais"
                aria-label={`Remover ajuste de ${o.categoriaNome}`}
                onClick={() => o.categoriaId != null && onRemover(o.categoriaId)}
              />
            ),
          },
        ]}
        footer={
          disponiveis.length > 0
            ? () => (
                <Select
                  id="admin-config-override-adicionar"
                  size="small"
                  showSearch
                  optionFilterProp="label"
                  placeholder="+ Adicionar ajuste para uma categoria"
                  value={null}
                  style={{ width: '100%', maxWidth: 300 }}
                  options={disponiveis.map((c) => ({ value: c.id, label: c.nome }))}
                  onChange={(id: number) => {
                    const c = disponiveis.find((x) => x.id === id)
                    if (c) onAdicionar(c)
                  }}
                />
              )
            : undefined
        }
      />
    </Flex>
  )
}

/** Aba "Categorias": tudo que muda só a nota da categoria (e, por ela, a categoria favorita). */
export function CategoriasSecao({
  pesos,
  onPesoChange,
  boost,
  onBoostChange,
  overrides,
  global,
  idsSalvos,
  categorias,
  onOverrideChange,
  onAdicionar,
  onRemover,
}: {
  pesos: PesoMetrica[]
  onPesoChange: (tipo: TipoEvento, peso: number) => void
  boost: number
  onBoostChange: (boost: number) => void
  overrides: ParametroDecay[]
  global: ParametroDecay
  idsSalvos: Set<number>
  categorias: Categoria[]
  onOverrideChange: (categoriaId: number, patch: PatchDecay) => void
  onAdicionar: (categoria: Categoria) => void
  onRemover: (categoriaId: number) => void
}) {
  const temFiltro = pesos.some((p) => p.tipoEvento === 'FILTRO_APLICADO')
  return (
    <Flex vertical gap={4}>
      {temFiltro && (
        <>
          <Flex vertical gap={8}>
            <HelpTitle
              label="Quanto filtrar por uma categoria soma nela"
              help="Filtrar o catálogo por uma categoria soma pontos na nota de interesse daquela categoria, na mesma escala da nota de produto. Não muda o nível do cliente."
            />
            <LinhaPeso tipo="FILTRO_APLICADO" pesos={pesos} onChange={onPesoChange} />
          </Flex>
          <Divider style={{ margin: '12px 0' }} />
        </>
      )}
      <Bonus boost={boost} onChange={onBoostChange} />
      <Divider style={{ margin: '4px 0 12px' }} />
      <AjustesPorCategoria
        overrides={overrides}
        global={global}
        idsSalvos={idsSalvos}
        categorias={categorias}
        onChange={onOverrideChange}
        onAdicionar={onAdicionar}
        onRemover={onRemover}
      />
    </Flex>
  )
}
