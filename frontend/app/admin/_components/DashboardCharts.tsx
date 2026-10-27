'use client'

import { Bar, Column, Line } from '@ant-design/charts'
import type { DashboardSeries } from '@/lib/types'
import { Card, Col, Row } from '@/components/ui'

type Props = { series: DashboardSeries }

export function DashboardCharts({ series }: Props) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={8}>
        <Card size="small" title="Distribuição de scores">
          <Column
            data={series.distribuicaoScores}
            xField="faixa"
            yField="quantidade"
            height={220}
            axis={{ y: { title: false } }}
            style={{ maxWidth: 40 }}
          />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card size="small" title="Contatos WhatsApp (14d)">
          <Line
            data={series.contatosPorDia}
            xField="data"
            yField="quantidade"
            height={220}
            axis={{
              x: {
                labelFormatter: (v: string) => v.slice(5),
              },
              y: { title: false },
            }}
          />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card size="small" title="Interesse por categoria">
          <Bar
            data={series.leadsPorCategoria}
            xField="quantidade"
            yField="categoria"
            height={220}
            axis={{ x: { title: false } }}
          />
        </Card>
      </Col>
    </Row>
  )
}
