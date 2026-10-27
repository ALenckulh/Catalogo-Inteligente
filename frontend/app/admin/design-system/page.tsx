'use client'

import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import { palette } from '@/lib/theme/tokens'
import type { ButtonColor, ButtonVariant, TableProps } from '@/components/ui'
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  FormItem,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from '@/components/ui'

const { Title, Text, Paragraph } = Typography

const VARIANTS: ButtonVariant[] = ['solid', 'outlined', 'dashed', 'filled', 'text', 'link']
const COLORS: ButtonColor[] = ['default', 'primary', 'danger']

const SCALE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const

const TABLE_ROWS = [
  { key: '1', nome: 'Produto A', status: 'Ativo' },
  { key: '2', nome: 'Produto B', status: 'Inativo' },
  { key: '3', nome: 'Produto C', status: 'Ativo' },
]

const tableColumns: TableProps<(typeof TABLE_ROWS)[number]>['columns'] = [
  { title: 'Nome', dataIndex: 'nome' },
  {
    title: 'Status',
    dataIndex: 'status',
    render: (status: string) => (
      <Tag color={status === 'Ativo' ? 'success' : 'default'}>{status}</Tag>
    ),
  },
]

function SwatchRow({
  name,
  scale,
}: {
  name: string
  scale: Record<number | string, string>
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        {name}
      </Text>
      <Flex gap={8} wrap="wrap">
        {SCALE_KEYS.filter((k) => scale[k]).map((k) => {
          const hex = scale[k]
          const dark = k >= 400
          return (
            <div key={k} style={{ width: 72, textAlign: 'center' }}>
              <div
                style={{
                  height: 40,
                  borderRadius: 6,
                  background: hex,
                  border: '1px solid var(--border-neutral-subtle)',
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  display: 'block',
                  marginTop: 4,
                  color: dark ? undefined : 'var(--text-neutral-default)',
                }}
              >
                {k}
              </Text>
              <Text type="secondary" style={{ fontSize: 10 }}>
                {hex}
              </Text>
            </div>
          )
        })}
      </Flex>
    </div>
  )
}

export default function AdminDesignSystemPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()

  if (authLoading || !isAdmin) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    )
  }

  return (
    <>
      <Title level={3} style={{ marginTop: 0 }}>
        Design system
      </Title>
      <Paragraph type="secondary">
        Tokens e componentes de <Text code>@/components/ui</Text> — só admin.
      </Paragraph>

      <Tabs
        items={[
          {
            key: 'cores',
            label: 'Cores',
            children: (
              <>
                <SwatchRow name="Primary" scale={palette.primary} />
                <SwatchRow name="Secondary" scale={palette.secondary} />
                <SwatchRow name="Neutral" scale={palette.neutral} />
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Semânticos
                </Text>
                <Flex gap={12} wrap="wrap">
                  {(
                    [
                      ['--primary', palette.primary[400]],
                      ['--secondary', palette.secondary[400]],
                      ['--success', palette.success[400]],
                      ['--warning', palette.warning[400]],
                      ['--error', palette.error[400]],
                    ] as const
                  ).map(([label, hex]) => (
                    <Flex key={label} align="center" gap={8}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: hex,
                          border: '1px solid var(--border-neutral-subtle)',
                        }}
                      />
                      <div>
                        <Text style={{ fontSize: 12 }}>{label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {hex}
                        </Text>
                      </div>
                    </Flex>
                  ))}
                </Flex>
              </>
            ),
          },
          {
            key: 'button',
            label: 'Button',
            children: (
              <Flex vertical gap={16}>
                {VARIANTS.map((variant) => (
                  <div key={variant}>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                      variant=&quot;{variant}&quot;
                    </Text>
                    <Space wrap>
                      {COLORS.map((color) => (
                        <Button
                          key={`${variant}-${color}`}
                          id={variant === 'solid' && color === 'primary' ? 'ds-btn-primary' : undefined}
                          variant={variant}
                          color={color}
                        >
                          {color}
                        </Button>
                      ))}
                    </Space>
                  </div>
                ))}
                <Button id="ds-btn-tooltip" color="primary" tooltip="Exemplo de tooltip">
                  Com tooltip
                </Button>
              </Flex>
            ),
          },
          {
            key: 'form',
            label: 'Formulário',
            children: (
              <Card style={{ maxWidth: 420 }}>
                <Form
                  layout="vertical"
                  onFinish={() => {
                    void message.success('Demo: formulário ok')
                  }}
                >
                  <FormItem
                    label="Nome"
                    name="nome"
                    rules={[{ required: true, message: 'Informe o nome' }]}
                  >
                    <Input id="ds-input-nome" placeholder="Nome" />
                  </FormItem>
                  <FormItem label="Senha" name="senha">
                    <Input.Password id="ds-input-senha" placeholder="Senha" />
                  </FormItem>
                  <FormItem label="Categoria" name="categoria" initialValue="a">
                    <Select
                      id="ds-select-categoria"
                      options={[
                        { value: 'a', label: 'Categoria A' },
                        { value: 'b', label: 'Categoria B' },
                      ]}
                    />
                  </FormItem>
                  <Button id="ds-form-submit" color="primary" htmlType="submit">
                    Enviar
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: 'card-alert',
            label: 'Card / Alert',
            children: (
              <Flex vertical gap={24}>
                <Flex gap={16} wrap="wrap">
                  {(['sm', 'md', 'lg'] as const).map((shadow) => (
                    <Card key={shadow} shadow={shadow} title={`shadow="${shadow}"`} style={{ width: 200 }}>
                      Conteúdo
                    </Card>
                  ))}
                </Flex>
                <Flex vertical gap={12} style={{ maxWidth: 480 }}>
                  <Alert type="info" title="Info" description="Mensagem informativa." showIcon />
                  <Alert type="success" title="Sucesso" description="Operação concluída." showIcon />
                  <Alert type="warning" title="Atenção" description="Verifique os dados." showIcon />
                  <Alert type="error" title="Erro" description="Algo falhou." showIcon />
                </Flex>
              </Flex>
            ),
          },
          {
            key: 'dados',
            label: 'Dados',
            children: (
              <Flex vertical gap={24}>
                <Space wrap>
                  <Tag>Default</Tag>
                  <Tag color="processing">Processing</Tag>
                  <Tag color="success">Success</Tag>
                  <Tag color="warning">Warning</Tag>
                  <Tag color="error">Error</Tag>
                  <Badge count={3}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 32,
                        height: 32,
                        background: 'var(--surface-neutral-default)',
                        borderRadius: 4,
                      }}
                    />
                  </Badge>
                  <Spin size="small" />
                </Space>
                <Table
                  size="small"
                  pagination={false}
                  columns={tableColumns}
                  dataSource={TABLE_ROWS}
                  style={{ maxWidth: 480 }}
                />
                <Empty description="Nenhum item" style={{ maxWidth: 320 }} />
              </Flex>
            ),
          },
        ]}
      />
    </>
  )
}
