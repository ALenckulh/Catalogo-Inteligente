'use client'

import { Bar } from '@ant-design/charts'
import { ArrowRightOutlined } from '@ant-design/icons'
import { Collapse, Empty, Flex, Typography } from '@/components/ui'
import { palette } from '@/lib/theme/tokens'
import type { SimulacaoImpacto } from '@/lib/types'
import { clientes } from './PreviaImpacto'

const CENARIO_HOJE = 'Hoje'
const CENARIO_NOVO = 'Com os ajustes'

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
  const barras = [
    ...data.categoriasAtual.map((c) => ({ categoria: c.nome, cenario: CENARIO_HOJE, quantidade: c.quantidade })),
    ...data.categoriasProposta.map((c) => ({ categoria: c.nome, cenario: CENARIO_NOVO, quantidade: c.quantidade })),
  ]

  return (
    <Flex vertical gap={12}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Quantos clientes têm cada categoria como favorita (a de maior interesse).
      </Typography.Text>
      <Bar
        data={barras}
        xField="categoria"
        yField="quantidade"
        colorField="cenario"
        group
        height={Math.max(140, data.categoriasAtual.length * 44 + 60)}
        scale={{ color: { domain: [CENARIO_HOJE, CENARIO_NOVO], range: [palette.neutral[400], palette.primary[600]] } }}
        axis={{
          x: { title: false },
          // Contagem de clientes: só marcas inteiras (sem "0,5 cliente").
          y: { title: 'Clientes', labelFormatter: (v: number) => (Number.isInteger(v) ? String(v) : '') },
        }}
        legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
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
                <Flex vertical gap={6}>
                  {data.mudancasCategoria.map((m) => (
                    <Flex key={m.usuarioId} align="center" gap={8} wrap>
                      <Typography.Text style={{ flex: '1 1 140px' }} ellipsis>
                        {m.nome}
                      </Typography.Text>
                      <Typography.Text type="secondary">{m.categoriaAtual ?? 'nenhuma'}</Typography.Text>
                      <ArrowRightOutlined style={{ color: palette.neutral[500], fontSize: 11 }} aria-hidden />
                      <Typography.Text strong>{m.categoriaProposta ?? 'nenhuma'}</Typography.Text>
                    </Flex>
                  ))}
                </Flex>
              ),
            },
          ]}
        />
      )}
    </Flex>
  )
}
