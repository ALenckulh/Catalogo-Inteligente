'use client'

import { Bar } from '@ant-design/charts'
import { TextoCelula } from '@/components/admin/celulas'
import { Collapse, Empty, Flex, Table } from '@/components/ui'
import { palette } from '@/lib/theme/tokens'
import type { SimulacaoImpacto, SimulacaoMudancaCategoria } from '@/lib/types'
import { HelpTitle } from '../../_components/HelpTitle'
import { CENARIO_HOJE, CENARIO_NOVO, clientes } from './PreviaImpacto'

const categoriaOuNenhuma = (v: string | null) => <TextoCelula texto={v ?? 'nenhuma'} />

/** Categoria favorita dos clientes hoje × com os ajustes (o que filtro, bônus e ajustes por categoria mudam). */
export function PreviaCategorias({ data }: { data: SimulacaoImpacto }) {
  if (data.categoriasAtual.length === 0 && data.categoriasProposta.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Nenhum cliente tem categoria favorita ainda: é preciso ter ações em produtos ou filtros por categoria."
      />
    )
  }
  // Sem mudança, a barra "Com os ajustes" só repetiria a de hoje.
  const mudou = JSON.stringify(data.categoriasAtual) !== JSON.stringify(data.categoriasProposta)
  const barras = [
    ...data.categoriasAtual.map((c) => ({ categoria: c.nome, cenario: CENARIO_HOJE, quantidade: c.quantidade })),
    ...(mudou ? data.categoriasProposta : []).map((c) => ({ categoria: c.nome, cenario: CENARIO_NOVO, quantidade: c.quantidade })),
  ]

  return (
    <Flex vertical gap={12}>
      <HelpTitle
        label="Categoria favorita"
        help="Quantos clientes têm cada categoria como a de maior interesse. Os ajustes desta aba mudam só isso, e não o nível do cliente (Quente, Morno, Frio)."
      />
      <Bar
        data={barras}
        xField="categoria"
        yField="quantidade"
        colorField="cenario"
        group
        height={Math.max(140, data.categoriasAtual.length * (mudou ? 44 : 30) + (mudou ? 60 : 30))}
        scale={{ color: { domain: [CENARIO_HOJE, CENARIO_NOVO], range: [mudou ? palette.neutral[400] : palette.primary[600], palette.primary[600]] } }}
        axis={{
          x: { title: false },
          // Contagem de clientes: só marcas inteiras (sem "0,5 cliente").
          y: { title: false, labelFormatter: (v: number) => (Number.isInteger(v) ? String(v) : '') },
        }}
        legend={mudou ? { color: { position: 'bottom', layout: { justifyContent: 'center' } } } : false}
        tooltip={{
          title: (d: { categoria: string }) => d.categoria,
          items: [(d: { cenario: string; quantidade: number }) => ({ name: d.cenario, value: clientes(d.quantidade) })],
        }}
      />
      {data.mudancasCategoria.length > 0 && (
        <Collapse
          ghost
          size="small"
          items={[
            {
              key: 'mudancas',
              label: `Ver ${data.mudancasCategoria.length === 1 ? 'o cliente que muda' : `os ${data.mudancasCategoria.length} clientes que mudam`} de categoria favorita`,
              children: (
                <Table<SimulacaoMudancaCategoria>
                  rowKey="usuarioId"
                  pagination={false}
                  dataSource={data.mudancasCategoria}
                  columns={[
                    { title: 'Cliente', dataIndex: 'nome', render: (v: string) => <TextoCelula texto={v} /> },
                    { title: 'Hoje', dataIndex: 'categoriaAtual', render: categoriaOuNenhuma },
                    { title: 'Com ajustes', dataIndex: 'categoriaProposta', render: categoriaOuNenhuma },
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
