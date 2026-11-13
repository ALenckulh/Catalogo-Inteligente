'use client'

import { useState } from 'react'
import { CheckCircleOutlined } from '@ant-design/icons'
import { Alert, Card, Flex, Segmented, Space, Spin, Typography } from '@/components/ui'
import { palette } from '@/lib/theme/tokens'
import type { SimulacaoImpacto, SimulacaoResponse } from '@/lib/types'
import { HelpTitle } from '../../_components/HelpTitle'
import { PreviaCategorias } from './PreviaCategorias'
import { PreviaImpacto, clientes } from './PreviaImpacto'
import { PreviaPrecisao } from './PreviaPrecisao'

export type AbaConfig = 'acoes' | 'duracao' | 'categorias'

/** Linha-resumo sempre visível: lembra o efeito de ajustes feitos em outras abas. */
function Resumo({ d }: { d: SimulacaoImpacto }) {
  const partes = [
    d.mudamDeNivel > 0 && `${clientes(d.mudamDeNivel)} ${d.mudamDeNivel === 1 ? 'muda' : 'mudam'} de nível`,
    d.mudamDeCategoria > 0 &&
      `${clientes(d.mudamDeCategoria)} ${d.mudamDeCategoria === 1 ? 'muda' : 'mudam'} de categoria favorita`,
  ].filter(Boolean)
  if (partes.length === 0) {
    return (
      <Flex align="center" gap={8}>
        <CheckCircleOutlined style={{ color: palette.success[700] }} />
        <Typography.Text>Nenhum cliente muda com estes ajustes.</Typography.Text>
      </Flex>
    )
  }
  return (
    <Typography.Text strong style={{ fontSize: 15 }}>
      {partes.join(' · ')}
    </Typography.Text>
  )
}

export function Previa({
  aba,
  data,
  carregando,
  erro,
}: {
  aba: AbaConfig
  data: SimulacaoResponse | null
  carregando: boolean
  erro: boolean
}) {
  const [visao, setVisao] = useState<'nivel' | 'precisao'>('nivel')

  return (
    <Card
      size="small"
      title={
        <HelpTitle
          label="Prévia com seus dados reais"
          help="Recalculamos agora as notas dos seus clientes a partir do histórico de ações, com os valores salvos (hoje) e com os ajustes em edição. Nada é gravado. O conteúdo acompanha a aba aberta; a primeira linha resume tudo o que muda."
        />
      }
      extra={
        carregando ? (
          <Space size={6}>
            <Spin size="small" />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              atualizando…
            </Typography.Text>
          </Space>
        ) : null
      }
    >
      {erro && <Alert type="error" showIcon title="Não foi possível calcular a prévia agora." style={{ marginBottom: 12 }} />}
      {!data ? (
        !erro && (
          <Flex justify="center" style={{ padding: 32 }}>
            <Spin />
          </Flex>
        )
      ) : (
        <Flex vertical gap={14}>
          <Resumo d={data.impacto} />
          {aba === 'categorias' ? (
            <PreviaCategorias data={data.impacto} />
          ) : (
            <>
              <Segmented
                size="small"
                value={visao}
                onChange={(v) => setVisao(v as 'nivel' | 'precisao')}
                options={[
                  { label: 'Nível dos clientes', value: 'nivel' },
                  { label: 'Precisão das previsões', value: 'precisao' },
                ]}
              />
              {visao === 'nivel' ? <PreviaImpacto data={data.impacto} /> : <PreviaPrecisao data={data.precisao} />}
            </>
          )}
        </Flex>
      )}
    </Card>
  )
}
