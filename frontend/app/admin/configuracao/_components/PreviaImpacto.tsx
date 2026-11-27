'use client'

import { Bar } from '@ant-design/charts'
import { ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { TextoCelula } from '@/components/admin/celulas'
import { NivelInteresseIcon } from '@/components/admin/NivelInteresseIcon'
import { Collapse, Flex, Table, Typography } from '@/components/ui'
import { NIVEIS_INTERESSE, type NivelInteresse } from '@/lib/nivelInteresse'
import { palette, text } from '@/lib/theme/tokens'
import type { SimulacaoImpacto, SimulacaoMudancaCliente } from '@/lib/types'

const ORDEM: NivelInteresse[] = ['QUENTE', 'MORNO', 'FRIO', 'SEM_SCORE']
export const CENARIO_HOJE = 'Hoje'
export const CENARIO_NOVO = 'Com os ajustes'

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
  if (nota(de) === nota(para)) return <strong>{nota(para)}</strong>
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
  // Sem mudança, a barra "Com os ajustes" só repetiria a de hoje.
  const mudou = ORDEM.some((n) => contagem(data.atual, n) !== contagem(data.proposta, n))
  const barras = [
    { cenario: CENARIO_HOJE, lista: data.atual },
    ...(mudou ? [{ cenario: CENARIO_NOVO, lista: data.proposta }] : []),
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
        height={mudou ? 140 : 116}
        scale={{
          color: { domain: ORDEM.map((n) => NIVEIS_INTERESSE[n].label), range: ORDEM.map((n) => NIVEIS_INTERESSE[n].cor) },
          y: { domain: [0, 1] },
        }}
        axis={{
          x: { title: false },
          y: { title: false, labelFormatter: (v: number) => `${Math.round(v * 100)}%` },
        }}
        legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
        label={{
          text: (d: { quantidade: number }) => (d.quantidade > 0 ? String(d.quantidade) : ''),
          position: 'inside',
          fill: text.inverse,
          fontWeight: 600,
        }}
        tooltip={{
          title: (d: { cenario: string }) => d.cenario,
          items: [(d: { nivel: string; quantidade: number }) => ({ name: d.nivel, value: `${clientes(d.quantidade)} de ${data.clientesAnalisados}` })],
        }}
      />

      {data.notaMediaAtual != null && (
        <Flex align="center" gap={8} wrap>
          <Typography.Text type="secondary">Nota média:</Typography.Text>
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
                  rowKey="usuarioId"
                  pagination={false}
                  dataSource={data.mudancas}
                  columns={[
                    { title: 'Cliente', dataIndex: 'nome', render: (v: string) => <TextoCelula texto={v} /> },
                    {
                      title: 'Nível',
                      key: 'nivel',
                      width: 80,
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
                      width: 96,
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
