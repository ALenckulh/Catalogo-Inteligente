'use client'

import { useEffect, useState } from 'react'
import { FireOutlined, SettingOutlined } from '@ant-design/icons'
import { PageError, PageLoading } from '@/components/layout/PageStates'
import { Alert, Button, Card, Col, Flex, Row, Statistic, Steps, Tag, Timeline, Typography } from '@/components/ui'
import { getDecay, getPesos } from '@/lib/api/admin'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import { NIVEIS_INTERESSE, nivelDoScore } from '@/lib/nivelInteresse'
import {
  EVENTOS_SCORING,
  ORDEM_EVENTOS,
  decayGlobal,
  fatorDecaimento,
  formatPontos,
  meiaVidaDeLambda,
  pontosPorAcao,
} from '@/lib/scoring'
import type { ParametroDecay, PesoMetrica, TipoEvento } from '@/lib/types'
import { ComposicaoNota, rotuloPontos } from '../configuracao/_components/PesosSecao'

const { Title, Paragraph, Text } = Typography

const PASSOS = [
  {
    title: 'O cliente navega',
    content: 'Só registramos o que ele faz se ele aceitar os cookies. Ele pode desligar isso quando quiser, na conta dele.',
  },
  { title: 'Cada ação vira pontos', content: 'Ver, favoritar ou chamar no WhatsApp somam pontos no produto.' },
  { title: 'A nota vira um nível', content: 'Quente, Morno ou Frio, no Dashboard e na lista de Usuários.' },
]

const DIAS_EXEMPLO = [0, 30, 90, 180]

const pct = (f: number) =>
  `${(f * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

function Bolinha({ cor }: { cor: string }) {
  return <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: cor }} />
}

function NivelTag({ nota }: { nota: number }) {
  const n = NIVEIS_INTERESSE[nivelDoScore(nota)]
  return (
    <Tag>
      <Flex gap={4} align="center">
        <Bolinha cor={n.cor} />
        {n.nome}
      </Flex>
    </Tag>
  )
}

function ValorDasAcoes({ pesos }: { pesos: PesoMetrica[] }) {
  const pontos = pontosPorAcao(pesos)
  const tipos = ORDEM_EVENTOS.filter(
    (t) => EVENTOS_SCORING[t].alvo !== 'categoria' && pesos.some((p) => p.tipoEvento === t),
  )
  return (
    <Flex vertical gap="middle">
      <ComposicaoNota pesos={pesos} />
      <Flex vertical gap="middle" role="list">
        {tipos.map((t) => (
          <Flex key={t} role="listitem" gap="middle" justify="space-between" align="flex-start">
            <Flex gap="small" align="baseline">
              <Bolinha cor={EVENTOS_SCORING[t].cor} />
              <Flex vertical>
                <Text strong>{EVENTOS_SCORING[t].nome}</Text>
                <Text type="secondary">{EVENTOS_SCORING[t].descricao}</Text>
              </Flex>
            </Flex>
            <Text strong style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
              {rotuloPontos(t, pontos[t] ?? 0)}
            </Text>
          </Flex>
        ))}
      </Flex>
      <Text type="secondary" style={{ fontSize: 'var(--font-size-base)' }}>
        A nota de um produto vai de 0 a 100. Compras registradas no cliente contam como um contato pelo WhatsApp quando
        ele tem 3 compras ou mais (e valem metade depois de 2 anos).
      </Text>
    </Flex>
  )
}

function Exemplo({ pesos }: { pesos: PesoMetrica[] }) {
  const pontos = pontosPorAcao(pesos)
  const etapas: Array<{ acao: string; tipo: TipoEvento; vezes: number }> = [
    { acao: 'Abriu o produto 3 vezes', tipo: 'VISUALIZACAO_PRODUTO', vezes: 3 },
    { acao: 'Ficou 2 minutos na página', tipo: 'TEMPO_PAGINA', vezes: 1 },
    { acao: 'Favoritou', tipo: 'FAVORITAR', vezes: 1 },
    { acao: 'Chamou no WhatsApp', tipo: 'CONTATO_WHATSAPP', vezes: 1 },
  ]
  let nota = 0
  const items = etapas.map((e) => {
    const ganho = (pontos[e.tipo] ?? 0) * e.vezes
    nota = Math.min(100, nota + ganho)
    return {
      color: EVENTOS_SCORING[e.tipo].cor,
      content: (
        <Flex gap="small" wrap align="center">
          <Text>{e.acao}</Text>
          <Text type="secondary">+{formatPontos(ganho)} pts · nota {Math.round(nota)}</Text>
          <NivelTag nota={nota} />
        </Flex>
      ),
    }
  })
  return (
    <Card>
      <Paragraph type="secondary">Um cliente olhando um motor no catálogo, nesta semana:</Paragraph>
      <Timeline items={items} />
    </Card>
  )
}

function Esfriamento({ decay }: { decay: ParametroDecay[] }) {
  const { lambda } = decayGlobal(decay)
  return (
    <Flex vertical gap="middle">
      <Paragraph style={{ margin: 0 }}>
        Interesse antigo vale menos que interesse recente. Na primeira semana a ação vale inteira; depois ela perde
        metade do valor a cada <Text strong>{Math.round(meiaVidaDeLambda(lambda))} dias</Text>. Sem contato, ela some
        depois de 6 meses.
      </Paragraph>
      <Row gutter={[16, 16]}>
        {DIAS_EXEMPLO.map((d) => (
          <Col key={d} xs={12} lg={6}>
            <Card size="small">
              <Statistic title={d === 0 ? 'Hoje' : `Depois de ${d} dias`} value={pct(fatorDecaimento(d, lambda, false))} />
              <Text type="secondary" style={{ fontSize: 'var(--font-size-base)' }}>
                Com contato ou compra: {pct(fatorDecaimento(d, lambda, true))}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
      <Alert
        type="info"
        showIcon
        title="Depois de um contato pelo WhatsApp, o interesse não esfria por 60 dias"
        description="A negociação continua por telefone ou WhatsApp, fora do site. O cliente não perde a nota só porque parou de navegar."
      />
    </Flex>
  )
}

export default function ProjetoPage() {
  const { isAdmin } = useRequireAdmin()
  const [dados, setDados] = useState<{ pesos: PesoMetrica[]; decay: ParametroDecay[] } | null>(null)
  const [falhou, setFalhou] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false
    Promise.all([getPesos(), getDecay()])
      .then(([pesos, decay]) => {
        if (!cancelled) setDados({ pesos, decay })
      })
      .catch(() => {
        if (!cancelled) setFalhou(true)
      })
    return () => {
      cancelled = true
    }
  }, [isAdmin, tentativa])

  if (!isAdmin) return null

  const retry = () => {
    setFalhou(false)
    setTentativa((n) => n + 1)
  }
  const carregando = (render: (d: NonNullable<typeof dados>) => React.ReactNode) =>
    falhou ? <PageError onRetry={retry} /> : dados ? render(dados) : <PageLoading />

  return (
    <Flex vertical gap={32}>
      <Flex vertical gap="middle" align="flex-start">
        <Title level={1} style={{ margin: 0 }}>
          Como o catálogo encontra clientes interessados
        </Title>
        <Paragraph type="secondary" style={{ margin: 0, maxWidth: 720 }}>
          O catálogo observa o que cada cliente faz nos produtos e transforma isso numa{' '}
          <Text strong>nota de interesse de 0 a 100</Text>. Assim você sabe quem está perto de comprar e qual produto
          oferecer quando ligar.
        </Paragraph>
        <Flex gap="small" wrap>
          <Button
            color="primary"
            id="projeto-ver-quentes"
            icon={<FireOutlined />}
            href="/admin/usuarios?nivel=QUENTE&status=ativo"
          >
            Ver clientes com alto interesse
          </Button>
          <Button id="projeto-ajustar" icon={<SettingOutlined />} href="/admin/configuracao">
            Ajustar o cálculo
          </Button>
        </Flex>
      </Flex>

      <section aria-labelledby="projeto-como-title">
        <Title id="projeto-como-title" level={2}>
          Como funciona
        </Title>
        <Steps current={-1} items={PASSOS} />
      </section>

      <section aria-labelledby="projeto-acoes-title">
        <Title id="projeto-acoes-title" level={2}>
          Quanto vale cada ação
        </Title>
        {carregando((d) => (
          <ValorDasAcoes pesos={d.pesos} />
        ))}
      </section>

      <section aria-labelledby="projeto-exemplo-title">
        <Title id="projeto-exemplo-title" level={2}>
          Exemplo
        </Title>
        {carregando((d) => (
          <Exemplo pesos={d.pesos} />
        ))}
      </section>

      <section aria-labelledby="projeto-tempo-title">
        <Title id="projeto-tempo-title" level={2}>
          O interesse esfria com o tempo
        </Title>
        {carregando((d) => (
          <Esfriamento decay={d.decay} />
        ))}
      </section>

      <section aria-labelledby="projeto-niveis-title">
        <Title id="projeto-niveis-title" level={2}>
          O que a nota significa
        </Title>
        <Paragraph type="secondary">O nível do cliente vem da maior nota entre os produtos que ele olhou.</Paragraph>
        <Row gutter={[16, 16]} role="list">
          {Object.values(NIVEIS_INTERESSE).map((n) => (
            <Col key={n.nome} xs={24} sm={12} lg={6} role="listitem">
              <Card size="small" style={{ height: '100%' }}>
                <Flex vertical gap="small">
                  <Flex gap="small" align="center">
                    <Bolinha cor={n.cor} />
                    <Text strong>{n.label}</Text>
                  </Flex>
                  <Text type="secondary">{n.descricao}</Text>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
        <Paragraph type="secondary" style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
          A <Text strong>categoria favorita</Text> de cada cliente segue a mesma ideia: junta as notas dos produtos que
          ele viu naquela categoria com as vezes em que filtrou o catálogo por ela.
        </Paragraph>
      </section>
    </Flex>
  )
}
