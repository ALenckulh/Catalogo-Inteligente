'use client'

import type { ReactNode } from 'react'
import { Bar, Line } from '@ant-design/charts'
import type { DashboardSeries } from '@/lib/types'
import { formatDate } from '@/lib/formatters'
import { palette } from '@/lib/theme/tokens'
import { Card, Col, Empty, Flex, Row } from '@/components/ui'
import { NIVEIS_INTERESSE, isNivelInteresse, type NivelInteresse } from '@/lib/nivelInteresse'
import { HelpTitle } from './HelpTitle'

type Props = { series: DashboardSeries }

const CHART_HEIGHT = 300
const LINE_HEIGHT = 280


const helpListStyle = { paddingLeft: 18, margin: '4px 0' } as const
const helpParagraphStyle = { margin: '4px 0' } as const

const CHART_META = {
  scores: {
    title: 'Nível de interesse dos clientes',
    help: (
      <div>
        <p style={helpParagraphStyle}>
          Mostra o quanto seus clientes cadastrados se interessam pelos seus produtos.
        </p>
        <ul style={helpListStyle}>
          <li>
            <strong>Quente:</strong> muito interesse. Bom momento para entrar em contato.
          </li>
          <li>
            <strong>Morno:</strong> algum interesse. Vale acompanhar.
          </li>
          <li>
            <strong>Frio:</strong> olhou pouco até agora.
          </li>
          <li>
            <strong>Sem interação:</strong> se cadastrou, mas ainda não navegou no catálogo.
          </li>
        </ul>
        <p style={helpParagraphStyle}>
          O sistema dá uma nota de interesse de 0 a 100, com base no que o cliente faz no
          catálogo: ver produtos, buscar, chamar no WhatsApp e comprar. O que é mais recente vale
          mais. Cada cliente aparece uma vez só: o total é igual ao card “Usuários ativos” e a faixa Quente é igual ao card “Clientes com alto interesse”.
        </p>
      </div>
    ),
    yTitle: 'Clientes',
  },
  contatos: {
    title: 'Contatos pelo WhatsApp — últimos 14 dias',
    help: (
      <div>
        <p style={helpParagraphStyle}>
          Quantas vezes alguém clicou no botão do WhatsApp para falar com você, em cada dia das
          últimas duas semanas.
        </p>
        <p style={helpParagraphStyle}>Conta clientes cadastrados e também visitantes sem cadastro.</p>
        <p style={helpParagraphStyle}>
          Picos mostram os dias de maior procura. Compare com promoções ou com quando você
          divulgou o catálogo.
        </p>
      </div>
    ),
    xTitle: 'Dia',
    yTitle: 'Contatos',
  },
  categorias: {
    title: 'Categoria favorita dos clientes',
    help: (
      <div>
        <p style={helpParagraphStyle}>Mostra quais tipos de produto mais atraem seus clientes.</p>
        <p style={helpParagraphStyle}>
          Cada cliente é contado na categoria que mais procura, com base no que viu, buscou,
          perguntou e comprou.
        </p>
        <p style={helpParagraphStyle}>
          Aparecem as 10 categorias com mais clientes. Se alguém gosta igualmente de duas
          categorias, conta nas duas.
        </p>
      </div>
    ),
    xTitle: 'Categoria',
    yTitle: 'Clientes',
  },
} as const

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? singular : pluralForm}`
}

function percent(parte: number, total: number): string {
  return `${total ? Math.round((parte / total) * 100) : 0}%`
}

const integerTicks = (v: number) => Number.isInteger(v)
const isEmpty = (rows: { quantidade: number }[]) => rows.every((d) => d.quantidade === 0)

function ChartCard({
  title,
  help,
  emptyText,
  height = CHART_HEIGHT,
  children,
}: {
  title: string
  help: ReactNode
  /** Quando definido, mostra o estado vazio com este texto no lugar do gráfico. */
  emptyText?: string
  height?: number
  children: ReactNode
}) {
  return (
    <Card size="small" title={<HelpTitle label={title} help={help} />}>
      {emptyText ? (
        <Flex align="center" justify="center" style={{ height }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
        </Flex>
      ) : (
        children
      )}
    </Card>
  )
}

export function DashboardCharts({ series }: Props) {
  const totalUsuarios = series.distribuicaoScores.reduce((acc, d) => acc + d.quantidade, 0)
  const niveis = series.distribuicaoScores
    .filter((d): d is { faixa: NivelInteresse; quantidade: number } => isNivelInteresse(d.faixa))
    .map((d) => ({
      ...NIVEIS_INTERESSE[d.faixa],
      quantidade: d.quantidade,
      pct: percent(d.quantidade, totalUsuarios),
    }))
  const maxNivel = Math.max(0, ...niveis.map((d) => d.quantidade))
  const formatoInesperado = series.distribuicaoScores.length > 0 && niveis.length === 0
  if (formatoInesperado) {
    console.warn(
      '[DashboardCharts] distribuicaoScores com faixas desconhecidas:',
      series.distribuicaoScores.map((d) => d.faixa),
    )
  }
  let scoresEmptyText: string | undefined
  if (formatoInesperado) scoresEmptyText = 'Não foi possível exibir os dados (formato inesperado)'
  else if (isEmpty(niveis)) scoresEmptyText = 'Nenhum cliente cadastrado'

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <ChartCard
          title={CHART_META.scores.title}
          help={CHART_META.scores.help}
          emptyText={scoresEmptyText}
        >
          {/* Bar transpõe o gráfico: xField = nível (eixo vertical), yField = valor (horizontal). */}
          <Bar
            data={niveis}
            xField="label"
            yField="quantidade"
            colorField="label"
            height={CHART_HEIGHT}
            legend={false}
            scale={{
              color: {
                domain: niveis.map((d) => d.label),
                range: niveis.map((d) => d.cor),
              },
              // Folga à direita para o rótulo "n · %" não ser cortado.
              y: { domainMin: 0, domainMax: Math.max(1, Math.ceil(maxNivel * 1.35)) },
            }}
            axis={{
              x: { title: false },
              y: { title: CHART_META.scores.yTitle, tickFilter: integerTicks },
            }}
            style={{ maxWidth: 40 }}
            label={{
              text: (d: { quantidade: number; pct: string }) => `${d.quantidade} · ${d.pct}`,
              position: 'right',
              textAlign: 'start',
              dx: 6,
              fill: palette.neutral[800],
            }}
            tooltip={{
              title: (d: { tooltipTitle: string }) => d.tooltipTitle,
              items: [
                (d: { quantidade: number; pct: string }) => ({
                  name: CHART_META.scores.yTitle,
                  value: `${d.quantidade.toLocaleString('pt-BR')} de ${plural(totalUsuarios, 'cliente', 'clientes')} (${d.pct})`,
                }),
                (d: { descricao: string }) => ({ name: 'Significa', value: d.descricao }),
              ],
            }}
          />
        </ChartCard>
      </Col>
      <Col xs={24} xl={12}>
        <ChartCard
          title={CHART_META.categorias.title}
          help={CHART_META.categorias.help}
          emptyText={
            isEmpty(series.leadsPorCategoria) ? 'Nenhum cliente com categoria favorita ainda' : undefined
          }
        >
          {/* Bar transpõe o gráfico: xField = categoria (eixo vertical), yField = valor (horizontal). */}
          <Bar
            data={series.leadsPorCategoria}
            xField="categoria"
            yField="quantidade"
            height={CHART_HEIGHT}
            axis={{
              x: { title: CHART_META.categorias.xTitle },
              y: { title: CHART_META.categorias.yTitle, tickFilter: integerTicks },
            }}
            style={{ fill: palette.primary[500], maxWidth: 40 }}
            label={{ text: 'quantidade', position: 'inside', fill: '#fff', fontWeight: 600 }}
            tooltip={{
              title: (d: { categoria: string }) => d.categoria,
              items: [
                (d: { quantidade: number }) => ({
                  name: CHART_META.categorias.yTitle,
                  value: `${plural(d.quantidade, 'cliente prefere', 'clientes preferem')} esta categoria`,
                }),
              ],
            }}
          />
        </ChartCard>
      </Col>
      <Col span={24}>
        <ChartCard
          title={CHART_META.contatos.title}
          help={CHART_META.contatos.help}
          height={LINE_HEIGHT}
          emptyText={isEmpty(series.contatosPorDia) ? 'Nenhum contato nos últimos 14 dias' : undefined}
        >
          <Line
            data={series.contatosPorDia}
            xField="data"
            yField="quantidade"
            height={LINE_HEIGHT}
            style={{ stroke: palette.primary[500], lineWidth: 2 }}
            point={{ sizeField: 3, style: { fill: palette.primary[500] } }}
            axis={{
              x: {
                title: CHART_META.contatos.xTitle,
                labelFormatter: (v: string) => formatDate(v, 'DD/MM'),
                labelAutoHide: true,
              },
              y: { title: CHART_META.contatos.yTitle, tickFilter: integerTicks },
            }}
            scale={{ y: { domainMin: 0, nice: true } }}
            tooltip={{
              title: (d: { data: string }) => formatDate(d.data, 'dddd, DD/MM'),
              items: [
                (d: { quantidade: number }) => ({
                  name: CHART_META.contatos.yTitle,
                  value:
                    d.quantidade === 0
                      ? 'Nenhum contato neste dia'
                      : `${plural(d.quantidade, 'contato iniciado', 'contatos iniciados')}`,
                }),
              ],
            }}
          />
        </ChartCard>
      </Col>
    </Row>
  )
}
