'use client'

import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { FireOutlined, PauseCircleOutlined, SettingOutlined } from '@ant-design/icons'
import { PageError, PageLoading } from '@/components/layout/PageStates'
import { Button, Card, Col, Divider, Flex, Row, Table, Tag, Timeline, Typography } from '@/components/ui'
import { getDecay, getPesos } from '@/lib/api/admin'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import { NIVEIS_INTERESSE, nivelDoScore } from '@/lib/nivelInteresse'
import { EVENTOS_SCORING, decayGlobal, fatorDecaimento, formatPontos, meiaVidaDeLambda, pontosPorAcao } from '@/lib/scoring'
import type { ParametroDecay, PesoMetrica, TipoEvento, TipoMetrica } from '@/lib/types'
import { HelpTitle } from '../_components/HelpTitle'
import { rotuloPontos } from '../configuracao/_components/PesosSecao'

const { Title, Paragraph, Text } = Typography

const APOIO = { fontSize: 'var(--font-size-base)' } as const
const NUMERO = { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } as const

const PASSOS = [
  {
    titulo: 'O cliente navega',
    texto: 'Só registramos o que ele faz se ele aceitar os cookies. Ele pode desligar isso quando quiser, na conta dele.',
  },
  { titulo: 'Cada ação vira pontos', texto: 'Ver, favoritar ou chamar no WhatsApp somam pontos no produto.' },
  { titulo: 'A nota vira um nível', texto: 'Quente, Morno ou Frio, no Dashboard e na lista de Usuários.' },
]

/** Ações de produto pela natureza, e não pelo peso: o grupo não muda quando o admin ajusta os pesos. */
const GRUPOS: Array<{ nome: string; tipos: TipoMetrica[] }> = [
  { nome: 'Intenção de compra', tipos: ['CONTATO_WHATSAPP', 'FAVORITAR', 'COMPRA'] },
  {
    nome: 'Navegação',
    tipos: ['PESQUISA', 'SCROLL_DEPTH', 'TEMPO_PAGINA', 'VISUALIZACAO_PRODUTO', 'RETORNO_PAGINA'],
  },
  { nome: 'Diminui a nota', tipos: ['DESFAVORITAR'] },
]

const DIAS_EXEMPLO = [0, 30, 90, 180]

const pct = (f: number) =>
  `${(f * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

function Bolinha({ cor }: { cor: string }) {
  return <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: cor }} />
}

/** Explicação à esquerda, conteúdo em cartão à direita; em tela estreita, um embaixo do outro. */
function Secao({ id, titulo, texto, children }: { id: string; titulo: string; texto: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <Divider style={{ margin: '0 0 var(--space-8)' }} />
      <Row gutter={[32, 16]}>
        <Col xs={24} lg={8}>
          <Title id={id} level={2} style={{ marginTop: 0, fontSize: 'var(--font-size-xl)' }}>
            {titulo}
          </Title>
          <Flex vertical gap="small">
            {texto}
          </Flex>
        </Col>
        <Col xs={24} lg={16}>
          <Card>{children}</Card>
        </Col>
      </Row>
    </section>
  )
}

function Passos() {
  return (
    <Card>
      <Row gutter={[32, 24]} role="list" aria-label="Como funciona">
        {PASSOS.map((p, i) => (
          <Col key={p.titulo} xs={24} md={8} role="listitem">
            <Flex gap="middle" align="flex-start">
              <Flex
                align="center"
                justify="center"
                style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'var(--surface-neutral-strong)' }}
              >
                <Text strong>{i + 1}</Text>
              </Flex>
              <Flex vertical gap={4} style={{ paddingTop: 3 }}>
                <Text strong>{p.titulo}</Text>
                <Text type="secondary">{p.texto}</Text>
              </Flex>
            </Flex>
          </Col>
        ))}
      </Row>
    </Card>
  )
}

function Acao({ tipo, pontos }: { tipo: TipoMetrica; pontos: number }) {
  const { nome, resumo, detalhe } = EVENTOS_SCORING[tipo]
  return (
    <Flex role="listitem" gap="0 16px" wrap justify="space-between" align="flex-start">
      {/* O resumo fica ao lado do nome; se não couber, desce para a linha de baixo. */}
      <Flex wrap gap="0 16px" align="baseline" style={{ flex: '1 1 100px' }}>
        <Text style={{ flex: '0 1 184px' }}>{detalhe ? <HelpTitle label={nome} help={detalhe} /> : nome}</Text>
        <Text type="secondary" style={{ ...APOIO, flex: '1 1 180px' }}>
          {resumo}
        </Text>
      </Flex>
      <Text strong style={NUMERO}>
        {rotuloPontos(tipo, pontos)}
      </Text>
    </Flex>
  )
}

function ValorDasAcoes({ pesos }: { pesos: PesoMetrica[] }) {
  const pontos = pontosPorAcao(pesos)
  const valor = (t: TipoMetrica) => pontos[t] ?? 0
  const grupos = GRUPOS.map((g) => ({
    nome: g.nome,
    tipos: g.tipos.filter((t) => valor(t) > 0).sort((a, b) => valor(b) - valor(a)),
  })).filter((g) => g.tipos.length > 0)
  return (
    <Secao
      id="projeto-acoes-title"
      titulo="Quanto vale cada ação"
      texto={
        <>
          <Text type="secondary">Cada ação soma pontos na nota daquele produto, que vai de 0 a 100.</Text>
          <Text type="secondary">“Até” quer dizer que fazer menos vale proporcionalmente menos.</Text>
        </>
      }
    >
      {grupos.map((g, i) => (
        <Fragment key={g.nome}>
          {i > 0 && <Divider style={{ margin: 'var(--space-5) 0' }} />}
          <Flex vertical gap={12}>
            <Title level={3} style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
              {g.nome}
            </Title>
            <Flex vertical gap={12} role="list" aria-label={g.nome}>
              {g.tipos.map((t) => (
                <Acao key={t} tipo={t} pontos={valor(t)} />
              ))}
            </Flex>
          </Flex>
        </Fragment>
      ))}
    </Secao>
  )
}

function Niveis() {
  return (
    <Secao
      id="projeto-niveis-title"
      titulo="O que a nota significa"
      texto={
        <>
          <Text type="secondary">O nível do cliente vem da maior nota entre os produtos que ele olhou.</Text>
          <Text type="secondary">
            A <Text strong>categoria favorita</Text> de cada cliente segue a mesma ideia: junta as notas dos produtos que
            ele viu naquela categoria com as vezes em que filtrou o catálogo por ela.
          </Text>
        </>
      }
    >
      <Flex vertical gap={12} role="list">
        {Object.values(NIVEIS_INTERESSE).map((n) => (
          <Flex key={n.nome} role="listitem" gap="0 16px" wrap>
            <Flex gap="small" align="center" style={{ flex: '0 0 160px' }}>
              <Bolinha cor={n.cor} />
              <Text strong>{n.label}</Text>
            </Flex>
            <Text type="secondary">{n.descricao}</Text>
          </Flex>
        ))}
      </Flex>
    </Secao>
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
    const nivel = NIVEIS_INTERESSE[nivelDoScore(nota)]
    return {
      color: nivel.cor,
      content: (
        <Flex gap="0 16px" wrap align="center">
          <Text style={{ flex: '1 1 180px' }}>{e.acao}</Text>
          <Flex gap="0 12px" wrap align="center">
            <Text type="secondary" style={{ ...NUMERO, minWidth: 56 }}>
              +{formatPontos(ganho)} pts
            </Text>
            <Text strong style={{ ...NUMERO, minWidth: 60 }}>
              nota {Math.round(nota)}
            </Text>
            <Flex style={{ minWidth: 64 }}>
              <Tag style={{ margin: 0 }}>{nivel.nome}</Tag>
            </Flex>
          </Flex>
        </Flex>
      ),
    }
  })
  return (
    <Secao
      id="projeto-exemplo-title"
      titulo="Exemplo"
      texto={
        <Text type="secondary">
          Um cliente olhando um motor no catálogo, nesta semana. A cada ação a nota sobe, e o nível acompanha.
        </Text>
      }
    >
      <Timeline items={items} style={{ marginBottom: 'calc(-1 * var(--space-5))' }} />
    </Secao>
  )
}

interface LinhaValor {
  situacao: string
  valores: number[]
}

function Esfriamento({ decay }: { decay: ParametroDecay[] }) {
  const { lambda, pausaDias } = decayGlobal(decay)
  const linhas: LinhaValor[] = [
    { situacao: 'Sem contato', valores: DIAS_EXEMPLO.map((d) => fatorDecaimento(d, lambda, false)) },
    { situacao: 'Com contato ou compra', valores: DIAS_EXEMPLO.map((d) => fatorDecaimento(d, lambda, true)) },
  ]
  return (
    <Secao
      id="projeto-tempo-title"
      titulo="O interesse esfria com o tempo"
      texto={
        <>
          <Text type="secondary">Interesse antigo vale menos que interesse recente.</Text>
          <Text type="secondary">
            Na primeira semana a ação vale inteira; depois ela perde metade do valor a cada{' '}
            <Text strong style={NUMERO}>{Math.round(meiaVidaDeLambda(lambda))} dias</Text>. Sem contato, ela some depois de 6 meses.
          </Text>
        </>
      }
    >
      <Table<LinhaValor>
        rowKey="situacao"
        dataSource={linhas}
        pagination={false}
        scroll={{ x: 520 }}
        columns={[
          { title: 'Quanto a ação ainda vale', dataIndex: 'situacao', width: '34%', rowScope: 'row' },
          ...DIAS_EXEMPLO.map((d, i) => ({
            title: d === 0 ? 'Hoje' : `${d} dias`,
            key: d,
            align: 'right' as const,
            render: (_: unknown, l: LinhaValor) => <Text style={NUMERO}>{pct(l.valores[i])}</Text>,
          })),
        ]}
      />
      {pausaDias > 0 && (
        <Flex gap="small" align="flex-start" style={{ marginTop: 'var(--space-5)' }}>
          <PauseCircleOutlined aria-hidden style={{ marginTop: 4 }} />
          <Flex vertical>
            <Text strong>Depois de um contato ou compra, o interesse não esfria por {pausaDias} dias</Text>
            <Text type="secondary" style={APOIO}>
              A negociação continua por telefone ou WhatsApp, fora do site. O cliente não perde a nota só porque parou de
              navegar.
            </Text>
          </Flex>
        </Flex>
      )}
    </Secao>
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

  return (
    <Flex vertical gap={32} style={{ maxWidth: 1120 }}>
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
            // No celular o rótulo não cabe em uma linha.
            style={{ height: 'auto', whiteSpace: 'normal' }}
          >
            Ver clientes com alto interesse
          </Button>
          <Button id="projeto-ajustar" icon={<SettingOutlined />} href="/admin/configuracao">
            Ajustar o cálculo
          </Button>
        </Flex>
      </Flex>

      <Passos />

      {falhou ? (
        <PageError onRetry={retry} />
      ) : dados ? (
        <>
          <ValorDasAcoes pesos={dados.pesos} />
          <Niveis />
          <Exemplo pesos={dados.pesos} />
          <Esfriamento decay={dados.decay} />
        </>
      ) : (
        <PageLoading />
      )}
    </Flex>
  )
}
