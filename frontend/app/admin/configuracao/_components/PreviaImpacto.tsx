'use client'

import { Bar } from '@ant-design/charts'
import { ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { NivelInteresseIcon } from '@/components/admin/NivelInteresseIcon'
import { Collapse, Flex, Table, Typography } from '@/components/ui'
import { NIVEIS_INTERESSE, type NivelInteresse } from '@/lib/nivelInteresse'
import { palette } from '@/lib/theme/tokens'
import type { SimulacaoImpacto, SimulacaoMudancaCliente } from '@/lib/types'

const ORDEM: NivelInteresse[] = ['QUENTE', 'MORNO', 'FRIO', 'SEM_SCORE']
const CENARIO_HOJE = 'Hoje'
const CENARIO_NOVO = 'Com os ajustes'

function contagem(lista: SimulacaoImpacto['atual'], nivel: NivelInteresse): number {
  return lista.find((c) => c.nivel === nivel)?.quantidade ?? 0
}

export function clientes(n: number): string {
  return `${n} ${n === 1 ? 'cliente' : 'clientes'}`
}

function nota(v: number | null): string {
  return v == null ? '—' : String(Math.round(v))
}

function SetaNota({ de, para }: { de: number | null; para: number | null }) {
  const delta = (para ?? 0) - (de ?? 0)
  const cor = delta > 0.5 ? palette.success[700] : delta < -0.5 ? palette.error[600] : palette.neutral[600]
  const Icone = delta > 0.5 ? ArrowUpOutlined : delta < -0.5 ? ArrowDownOutlined : ArrowRightOutlined
  return (
    <Flex align="center" gap={6} style={{ fontVariantNumeric: 'tabular-nums' }}>
      <span>{nota(de)}</span>
      <Icone style={{ color: cor, fontSize: 12 }} aria-hidden />
      <strong>{nota(para)}</strong>
    </Flex>
  )
}

/** Níveis de interesse hoje × com os ajustes; os clientes que mais mudam ficam recolhidos. */
export function PreviaImpacto({ data }: { data: SimulacaoImpacto }) {
  const total = Math.max(1, data.clientesAnalisados)
  const barras = [
    { cenario: CENARIO_HOJE, lista: data.atual },
    { cenario: CENARIO_NOVO, lista: data.proposta },
  ].flatMap(({ cenario, lista }) =>
    ORDEM.map((n) => {
      const q = contagem(lista, n)
      return { cenario, nivel: NIVEIS_INTERESSE[n].label, quantidade: q, pct: q / total }
    }),
  )

  return (
    <Flex vertical gap={12}>
      <Bar
        data={barras}
        xField="cenario"
        yField="pct"
        colorField="nivel"
        stack
        height={140}
        scale={{
          color: { domain: ORDEM.map((n) => NIVEIS_INTERESSE[n].label), range: ORDEM.map((n) => NIVEIS_INTERESSE[n].cor) },
          y: { domain: [0, 1] },
        }}
        axis={{
          x: { title: false },
          y: { title: `Clientes (${data.clientesAnalisados} no total)`, labelFormatter: (v: number) => `${Math.round(v * 100)}%` },
        }}
        legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
        label={{
          text: (d: { quantidade: number }) => (d.quantidade > 0 ? String(d.quantidade) : ''),
          position: 'inside',
          fill: '#fff',
          fontWeight: 600,
        }}
        tooltip={{
          title: (d: { cenario: string }) => d.cenario,
          items: [(d: { nivel: string; quantidade: number }) => ({ name: d.nivel, value: clientes(d.quantidade) })],
        }}
      />

      {data.notaMediaAtual != null && (
        <Flex align="center" gap={8} wrap>
          <Typography.Text type="secondary">Nota média dos clientes:</Typography.Text>
          <SetaNota de={data.notaMediaAtual} para={data.notaMediaProposta} />
        </Flex>
      )}

      {data.mudancas.length > 0 && (
        <Collapse
          ghost
          size="small"
          items={[
            {
              key: 'mudancas',
              label: `Ver ${data.mudancas.length === 1 ? 'o cliente que muda' : `os ${data.mudancas.length} clientes que mais mudam`}`,
              children: (
                <Table<SimulacaoMudancaCliente>
                  size="small"
                  rowKey="usuarioId"
                  pagination={false}
                  dataSource={data.mudancas}
                  columns={[
                    { title: 'Cliente', dataIndex: 'nome', ellipsis: true },
                    {
                      title: 'Nível',
                      key: 'nivel',
                      width: 100,
                      render: (_, r) => (
                        <Flex align="center" gap={6}>
                          <NivelInteresseIcon nivel={r.nivelAtual} />
                          <ArrowRightOutlined style={{ color: palette.neutral[500], fontSize: 11 }} aria-hidden />
                          <NivelInteresseIcon nivel={r.nivelProposto} />
                        </Flex>
                      ),
                    },
                    {
                      title: 'Nota',
                      key: 'nota',
                      width: 100,
                      render: (_, r) => <SetaNota de={r.notaAtual} para={r.notaProposta} />,
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}
    </Flex>
  )
}
