'use client'

import { Space, Table, Tag, Typography, type TableProps } from '@/components/ui'

const { Title, Paragraph, Text } = Typography

interface ModelRow {
  key: string
  name: string
  interpretability: string
  sparsity: string
  minData: string
  anon: string
  coldStart: string
  b2bCalib: string
  scalability: string
  status: 'implemented' | 'future'
  statusLabel: string
}

const MODELS: ModelRow[] = [
  { key: 'knn', name: 'KNN / Neighborhood', interpretability: 'Alta', sparsity: 'Média', minData: 'Baixo', anon: 'Sim', coldStart: 'Sim', b2bCalib: '✗', scalability: 'Baixa', status: 'future', statusLabel: 'Trabalho futuro' },
  { key: 'ppr', name: 'Grafo / PPR', interpretability: 'Média', sparsity: 'Alta', minData: 'Baixo', anon: 'Sim', coldStart: 'Sim', b2bCalib: '✗', scalability: 'Média', status: 'future', statusLabel: 'Trabalho futuro' },
  { key: 'rules', name: 'Regras + Decay', interpretability: 'Alta', sparsity: 'Alta', minData: 'Nenhum', anon: 'Sim', coldStart: 'Sim (fallback)', b2bCalib: '✓ Núcleo', scalability: 'Alta', status: 'implemented', statusLabel: '✓ Implementado' },
  { key: 'seq', name: 'Regras Sequenciais', interpretability: 'Alta', sparsity: 'Média', minData: 'Baixo', anon: 'Sim', coldStart: 'Sim', b2bCalib: '✗', scalability: 'Alta', status: 'future', statusLabel: 'Trabalho futuro' },
  { key: 'mf', name: 'Matrix Factorization', interpretability: 'Baixa', sparsity: 'Baixa', minData: 'Alto', anon: 'Não', coldStart: 'Não', b2bCalib: '✗', scalability: 'Alta', status: 'future', statusLabel: 'Trabalho futuro' },
]

const columns: TableProps<ModelRow>['columns'] = [
  { title: 'Modelo', dataIndex: 'name', render: (v) => <Text strong>{v}</Text> },
  { title: 'Interpretabilidade',       dataIndex: 'interpretability' },
  { title: 'Resistência esparsidade',  dataIndex: 'sparsity' },
  { title: 'Vol. mín. dados',          dataIndex: 'minData' },
  { title: 'Usuário anônimo',          dataIndex: 'anon' },
  { title: 'Cold start',               dataIndex: 'coldStart' },
  {
    title: 'Calibração B2B',
    dataIndex: 'b2bCalib',
    render: (v: string) =>
      v.startsWith('✓') ? <Text type="success" strong>{v}</Text> : <Text type="secondary">{v}</Text>,
  },
  { title: 'Escalabilidade', dataIndex: 'scalability' },
  {
    title: 'Status',
    dataIndex: 'statusLabel',
    render: (_v, row) => (
      <Tag color={row.status === 'implemented' ? 'success' : 'default'}>{row.statusLabel}</Tag>
    ),
  },
]

export function ModelsTable() {
  return (
    <section id="models" aria-labelledby="models-title" style={{ padding: '96px 24px' }}>
      <Space orientation="vertical" size={32} style={{ maxWidth: 1152, margin: '0 auto', display: 'flex' }}>
        <Space orientation="vertical" size={8} align="center" style={{ width: '100%', textAlign: 'center' }}>
          <Title id="models-title" level={2} style={{ margin: 0 }}>Comparação de Modelos</Title>
          <Paragraph type="secondary" style={{ fontSize: 17, maxWidth: 672, margin: 0 }}>
            Por que regras ponderadas com decaimento temporal foram escolhidas como
            núcleo — e as demais técnicas adiadas para quando houver dados reais.
          </Paragraph>
        </Space>

        <Table
          size="small"
          dataSource={MODELS}
          columns={columns}
          pagination={false}
          scroll={{ x: true }}
          rowClassName={(row) => (row.status === 'implemented' ? 'models-table-highlight' : '')}
        />
      </Space>
    </section>
  )
}
