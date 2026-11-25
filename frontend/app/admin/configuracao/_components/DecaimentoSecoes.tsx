'use client'

import { useState, type ReactNode } from 'react'
import { Line } from '@ant-design/charts'
import {
  DeleteOutlined,
  FilterOutlined,
  HourglassOutlined,
  MessageOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  RetweetOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { TextoCelula } from '@/components/admin/celulas'
import { Button, Flex, InputNumber, Segmented, Select, Table, Tooltip, Typography } from '@/components/ui'
import { fatorDecaimento, lambdaDeMeiaVida, meiaVidaDeLambda } from '@/lib/scoring'
import { palette } from '@/lib/theme/tokens'
import type { Categoria, ParametroDecay, PesoMetrica, TipoMetrica } from '@/lib/types'
import { HelpTitle } from '../../_components/HelpTitle'
import { LinhaPeso, LinhaSlider } from './PesosSecao'

const MEIA_VIDA_MIN = 7
const MEIA_VIDA_MAX = 180
const PAUSA_MAX = 180
/** Teto da especificação (docs/04 §4.3): 1,50×. */
const BONUS_MAX_PCT = 50
const SERIE_HOJE = 'Hoje'
const SERIE_NOVO = 'Com o novo ajuste'

function diasDeLambda(lambda: number): number {
  return Math.round(meiaVidaDeLambda(lambda))
}

function boostParaPct(boost: number): number {
  return Math.round((boost - 1) * 100)
}

function pctParaBoost(pct: number): number {
  return Math.round((1 + pct / 100) * 100) / 100
}

function lambdaTexto(lambda: number): string {
  return `λ ${lambda.toFixed(5).replace('.', ',')}`
}

function diasTexto(dias: number): string {
  return dias > 0 ? `${dias} dias` : 'sem pausa'
}

function RotuloComAjuda({ icone, texto, help }: { icone: ReactNode; texto: string; help: ReactNode }) {
  return (
    <>
      {icone}
      <HelpTitle label={texto} help={help} />
    </>
  )
}

/** Valor à direita da linha; discreto quando não tem efeito (0%, sem pausa). */
function ValorDaLinha({ ativo, children }: { ativo: boolean; children: ReactNode }) {
  return (
    <Typography.Text strong={ativo} type={ativo ? undefined : 'secondary'}>
      {children}
    </Typography.Text>
  )
}

// ------------------------------------------------------------ aba "Duração"

export function MeiaVidaSecao({
  lambdaSalvo,
  lambda,
  pausaDias,
  onChange,
  onPausaChange,
}: {
  lambdaSalvo: number
  lambda: number
  pausaDias: number
  onChange: (lambda: number) => void
  onPausaChange: (dias: number) => void
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
    <Flex vertical gap={28}>
      <Flex vertical gap={14}>
        <LinhaSlider
          rotulo={
            <RotuloComAjuda
              icone={<HourglassOutlined aria-hidden />}
              texto="Meia-vida"
              help="Em quantos dias uma ação perde metade do valor. Na primeira semana vale 100%."
            />
          }
          nome="Meia-vida"
          min={MEIA_VIDA_MIN}
          max={MEIA_VIDA_MAX}
          step={1}
          value={Math.min(MEIA_VIDA_MAX, Math.max(MEIA_VIDA_MIN, dias))}
          formatar={(v) => `${v} dias`}
          valor={
            // λ da spec (RF25): o controle é a meia-vida em dias.
            <Tooltip title={lambdaTexto(lambda)}>
              <span>
                <ValorDaLinha ativo>{Number.isFinite(dias) ? `${dias} dias` : 'nunca'}</ValorDaLinha>
              </span>
            </Tooltip>
          }
          onChange={(d) => onChange(lambdaDeMeiaVida(d))}
        />
        <LinhaSlider
          rotulo={
            <RotuloComAjuda
              icone={<PauseCircleOutlined aria-hidden />}
              texto="Pausa"
              help="Dias em que o produto de um contato ou compra fica com 100%, porque a negociação segue fora do site. Vale para todas as categorias."
            />
          }
          nome="Pausa depois de contato ou compra"
          max={PAUSA_MAX}
          step={5}
          value={pausaDias}
          formatar={diasTexto}
          valor={<ValorDaLinha ativo={pausaDias > 0}>{diasTexto(pausaDias)}</ValorDaLinha>}
          onChange={onPausaChange}
        />
      </Flex>
      <Flex vertical gap={8}>
        <Flex justify="space-between" align="center" gap={8} wrap>
          <HelpTitle
            label="Valor da ação"
            help="Quanto uma ação ainda vale a cada dia. Sem contato nem compra, cai mais rápido depois de 3 meses e some aos 6. Com contato ou compra, dura mais."
          />
          <Segmented
            size="small"
            value={comConversao ? 'com' : 'sem'}
            onChange={(v) => setComConversao(v === 'com')}
            options={[
              { label: 'Sem contato', value: 'sem' },
              { label: 'Com contato', value: 'com' },
            ]}
          />
        </Flex>
        <Line
          data={dados}
          xField="dia"
          yField="valor"
          colorField="serie"
          height={180}
          scale={{
            color: { domain: [SERIE_HOJE, SERIE_NOVO], range: [mudou ? palette.neutral[500] : palette.primary[600], palette.primary[600]] },
            y: { domain: [0, 100] },
          }}
          style={{
            lineWidth: 2,
            // Curva de hoje tracejada para não se confundir com a nova quando ficam próximas.
            lineDash: (d: { serie: string }[]) => (d[0]?.serie === SERIE_HOJE && mudou ? [5, 4] : [0, 0]),
          }}
          legend={mudou ? { color: { position: 'bottom', layout: { justifyContent: 'center' } } } : false}
          axis={{
            x: { title: false, labelFormatter: (v: number) => `${v}d` },
            y: { title: false, labelFormatter: (v: number) => `${v}%` },
          }}
          tooltip={{
            title: (d: { dia: number }) => `${d.dia} dias depois`,
            items: [(d: { serie: string; valor: number }) => ({ name: d.serie, value: `${d.valor}%` })],
          }}
        />
      </Flex>
    </Flex>
  )
}

// ---------------------------------------------------------- aba "Categorias"

type PatchDecay = Partial<Pick<ParametroDecay, 'lambda' | 'boostConversao' | 'boostRecorrencia'>>

/** Os dois bônus, na linha geral e na tabela de ajustes; o ícone liga uma à outra. */
const BONUS = [
  {
    campo: 'boostConversao',
    rotulo: 'Contato ou compra',
    nome: 'Bônus de categoria',
    Icone: MessageOutlined,
    help: 'Bônus na nota da categoria em que o cliente chamou no WhatsApp ou comprou nos últimos 30 dias.',
  },
  {
    campo: 'boostRecorrencia',
    rotulo: 'Compra recorrente',
    nome: 'Bônus de recorrência',
    Icone: RetweetOutlined,
    help: 'Bônus na nota da categoria comprada em datas diferentes, para quem tem 3 compras ou mais.',
  },
] as const

function bonusTexto(boost: number): string {
  const pct = boostParaPct(boost)
  return pct > 0 ? `+${pct}%` : 'sem bônus'
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
  /** Valores gerais, citados na dica de cada campo. */
  global: ParametroDecay
  /** Categorias com ajuste já gravado; as demais ganham o ícone "Ainda não salvo". */
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
      <Flex justify="space-between" align="center" gap={8} wrap>
        <HelpTitle
          label="Ajustes por categoria"
          help="Para categorias em que o interesse dura mais ou menos, ou que pedem bônus menor: em bens duráveis, quem acabou de comprar já foi atendido. As demais usam os valores gerais."
        />
        {disponiveis.length > 0 && (
          <Select
            id="admin-config-override-adicionar"
            size="small"
            aria-label="Adicionar ajuste para uma categoria"
            showSearch
            optionFilterProp="label"
            prefix={<PlusOutlined />}
            placeholder="Adicionar"
            popupMatchSelectWidth={false}
            value={null}
            style={{ width: 150 }}
            options={disponiveis.map((c) => ({ value: c.id, label: c.nome }))}
            onChange={(id: number) => {
              const c = disponiveis.find((x) => x.id === id)
              if (c) onAdicionar(c)
            }}
          />
        )}
      </Flex>
      {overrides.length > 0 && (
        <Table<ParametroDecay>
          rowKey={(o) => String(o.categoriaId)}
          pagination={false}
          scroll={{ x: 460 }}
          dataSource={overrides}
          columns={[
            {
              title: 'Categoria',
              key: 'categoria',
              render: (_, o) => (
                <Flex align="center" gap={6}>
                  <TextoCelula texto={o.categoriaNome ?? `Categoria ${o.categoriaId}`} />
                  {o.categoriaId != null && !idsSalvos.has(o.categoriaId) && (
                    <Tooltip title="Ainda não salvo">
                      <WarningOutlined aria-label="Ainda não salvo" style={{ color: palette.warning[700] }} />
                    </Tooltip>
                  )}
                </Flex>
              ),
            },
            {
              title: <HelpTitle label="Meia-vida" help="Em quantos dias uma ação perde metade do valor nesta categoria." />,
              key: 'meiaVida',
              width: 108,
              render: (_, o) => {
                const dias = diasDeLambda(o.lambda)
                return (
                  <Tooltip
                    title={`${lambdaTexto(o.lambda)} · ${dias === diasGeral ? 'igual ao geral' : `geral: ${diasGeral} dias`}`}
                  >
                    <InputNumber
                      size="small"
                      aria-label={`Meia-vida de ${o.categoriaNome}`}
                      min={MEIA_VIDA_MIN}
                      max={365}
                      value={dias}
                      suffix="dias"
                      style={{ width: 88 }}
                      onChange={(v) =>
                        o.categoriaId != null && onChange(o.categoriaId, { lambda: lambdaDeMeiaVida(Number(v ?? MEIA_VIDA_MIN)) })
                      }
                    />
                  </Tooltip>
                )
              },
            },
            ...BONUS.map(({ campo, rotulo, nome, Icone, help }) => ({
              title: (
                <Tooltip title={`${rotulo}: ${help}`}>
                  <Icone aria-label={nome} />
                </Tooltip>
              ),
              key: campo,
              width: 84,
              render: (_: unknown, o: ParametroDecay) => (
                <Tooltip title={`${rotulo} · ${o[campo] === global[campo] ? 'igual ao geral' : `geral: ${bonusTexto(global[campo])}`}`}>
                  <InputNumber<number>
                    size="small"
                    aria-label={`${nome} de ${o.categoriaNome}`}
                    min={0}
                    max={BONUS_MAX_PCT}
                    step={5}
                    value={boostParaPct(o[campo])}
                    formatter={(v) => `+${v ?? 0}%`}
                    parser={(v) => Number((v ?? '').replace(/[^0-9]/g, '') || 0)}
                    style={{ width: 68 }}
                    onChange={(v) => o.categoriaId != null && onChange(o.categoriaId, { [campo]: pctParaBoost(Number(v ?? 0)) })}
                  />
                </Tooltip>
              ),
            })),
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
                  tooltip="Remover: volta aos valores gerais"
                  aria-label={`Remover ajuste de ${o.categoriaNome}`}
                  onClick={() => o.categoriaId != null && onRemover(o.categoriaId)}
                />
              ),
            },
          ]}
        />
      )}
    </Flex>
  )
}

/** Aba "Categorias": tudo que muda só a nota da categoria (e, por ela, a categoria favorita). */
export function CategoriasSecao({
  pesos,
  onPesoChange,
  onGlobalChange,
  overrides,
  global,
  idsSalvos,
  categorias,
  onOverrideChange,
  onAdicionar,
  onRemover,
}: {
  pesos: PesoMetrica[]
  onPesoChange: (tipo: TipoMetrica, peso: number) => void
  onGlobalChange: (patch: PatchDecay) => void
  overrides: ParametroDecay[]
  global: ParametroDecay
  idsSalvos: Set<number>
  categorias: Categoria[]
  onOverrideChange: (categoriaId: number, patch: PatchDecay) => void
  onAdicionar: (categoria: Categoria) => void
  onRemover: (categoriaId: number) => void
}) {
  return (
    <Flex vertical gap={28}>
      <Flex vertical gap={14}>
        {pesos.some((p) => p.tipoEvento === 'FILTRO_APLICADO') && (
          <LinhaPeso
            tipo="FILTRO_APLICADO"
            pesos={pesos}
            rotulo={
              <RotuloComAjuda
                icone={<FilterOutlined aria-hidden />}
                texto="Filtro por categoria"
                help="Cada filtro por uma categoria soma estes pontos na nota dela (de 100)."
              />
            }
            onChange={onPesoChange}
          />
        )}
        {BONUS.map(({ campo, rotulo, nome, Icone, help }) => {
          const pct = boostParaPct(global[campo])
          return (
            <LinhaSlider
              key={campo}
              rotulo={<RotuloComAjuda icone={<Icone aria-hidden />} texto={rotulo} help={help} />}
              nome={nome}
              max={BONUS_MAX_PCT}
              step={5}
              value={Math.min(BONUS_MAX_PCT, Math.max(0, pct))}
              formatar={(v) => (v > 0 ? `+${v}%` : 'sem bônus')}
              valor={<ValorDaLinha ativo={pct > 0}>{pct > 0 ? `+${pct}%` : '0%'}</ValorDaLinha>}
              onChange={(v) => onGlobalChange({ [campo]: pctParaBoost(v) })}
            />
          )
        })}
      </Flex>
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
