'use client'

import { NotaCelula, TextoCelula } from '@/components/admin/celulas'
import { Card, Flex, Table, Tag } from '@/components/ui'
import type { TableProps } from '@/components/ui'
import type { LeadResumo } from '@/lib/types'
import { HelpTitle } from './HelpTitle'

const COLUNAS: TableProps<LeadResumo>['columns'] = [
  {
    title: 'Cliente',
    key: 'cliente',
    render: (_, l) => (
      <Flex gap="small" align="center">
        <TextoCelula texto={l.nome} href={`/admin/usuarios/${l.usuarioId}`} />
        <Tag>{l.tipo}</Tag>
      </Flex>
    ),
  },
  {
    title: 'Nota',
    key: 'nota',
    width: 96,
    render: (_, l) => <NotaCelula nota={l.scoreMaxProduto} />,
  },
  { title: 'Categoria de interesse', dataIndex: 'topCategoria', render: (v: string | null) => <TextoCelula texto={v} /> },
  { title: 'Próxima compra provável', dataIndex: 'proximaCompra', render: (v: string | null) => <TextoCelula texto={v} /> },
]

const MAX_LINHAS = 5

/** Clientes ativos com maior nota, do maior para o menor (RF20). */
export function LeadsTabela({ leads }: { leads: LeadResumo[] }) {
  return (
    <Card
      size="small"
      // Em 320px o título não cabe numa linha e alargava a página.
      styles={{ title: { whiteSpace: 'normal' } }}
      title={
        <HelpTitle
          label="Clientes para contatar primeiro"
          help="Os 5 clientes com maior nota de interesse em algum produto. “Próxima compra provável” é o produto de maior nota que o cliente não comprou nos últimos 30 dias."
        />
      }
    >
      <Table
        rowKey="usuarioId"
        columns={COLUNAS}
        dataSource={leads.slice(0, MAX_LINHAS)}
        pagination={false}
        scroll={{ x: 640 }}
        locale={{ emptyText: 'Nenhum cliente com nota ainda' }}
      />
    </Card>
  )
}
