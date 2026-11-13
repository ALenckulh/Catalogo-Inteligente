'use client'

import { useEffect, useState } from 'react'
import { ReloadOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import { getDecay, getPesos, recalcularScores, removerDecayCategoria, saveDecay, savePesos } from '@/lib/api/admin'
import { listCategorias } from '@/lib/api/categorias'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import {
  BOOST_PADRAO,
  EVENTOS_SCORING,
  LAMBDA_PADRAO,
  PESOS_PADRAO,
  decayGlobal,
  formatPontos,
  meiaVidaDeLambda,
  pontosPorAcao,
} from '@/lib/scoring'
import type { Categoria, ParametroDecay, PesoMetrica, TipoEvento } from '@/lib/types'
import { App, Badge, Button, Card, Checkbox, Col, Flex, Popconfirm, Row, Space, Spin, Typography, message } from '@/components/ui'
import { CategoriasSecao, MeiaVidaSecao } from './_components/DecaimentoSecoes'
import { PesosSecao } from './_components/PesosSecao'
import { Previa, type AbaConfig } from './_components/Previa'
import { useSimulacao } from './_components/useSimulacao'

const { Title } = Typography

type Alteracao = { nome: string; de: string; para: string }

function dias(lambda: number): string {
  return `${Math.round(meiaVidaDeLambda(lambda))} dias`
}

function bonus(boost: number): string {
  const p = Math.round((boost - 1) * 100)
  return p > 0 ? `+${p}%` : 'sem bônus'
}

/** Ajustes por categoria que estavam salvos e foram removidos na edição. */
function removidas(decay: ParametroDecay[], decaySalvo: ParametroDecay[]): ParametroDecay[] {
  return decaySalvo.filter((s) => s.categoriaId != null && !decay.some((d) => d.categoriaId === s.categoriaId))
}

/** Alterações em linguagem de negócio, para o modal de confirmação. */
function listarAlteracoes(
  pesos: PesoMetrica[],
  pesosSalvos: PesoMetrica[],
  decay: ParametroDecay[],
  decaySalvo: ParametroDecay[],
): Alteracao[] {
  const out: Alteracao[] = []
  const ptsAntes = pontosPorAcao(pesosSalvos)
  const ptsDepois = pontosPorAcao(pesos)
  for (const p of pesos) {
    const antes = pesosSalvos.find((s) => s.tipoEvento === p.tipoEvento)?.peso
    if (antes === p.peso) continue
    const e = EVENTOS_SCORING[p.tipoEvento]
    const alvo = e.alvo === 'categoria' ? ' na categoria' : ''
    const pts = (v: number | undefined) => ` (${formatPontos(v ?? 0)} pts${alvo})`
    out.push({
      nome: e.nome,
      de: `peso ${antes ?? 0}${pts(ptsAntes[p.tipoEvento])}`,
      para: `peso ${p.peso}${pts(ptsDepois[p.tipoEvento])}`,
    })
  }
  for (const r of removidas(decay, decaySalvo)) {
    out.push({
      nome: `Ajuste próprio — ${r.categoriaNome ?? `categoria ${r.categoriaId}`}`,
      de: `${dias(r.lambda)}, ${bonus(r.boostConversao)}`,
      para: 'removido (usa os valores gerais)',
    })
  }
  for (const d of decay) {
    const antes = decaySalvo.find((s) => s.categoriaId === d.categoriaId)
    const escopo = d.categoriaId == null ? '' : ` — ${d.categoriaNome ?? `categoria ${d.categoriaId}`}`
    if (!antes && d.categoriaId != null) {
      // Ajuste novo: um item só, em vez de meia-vida e bônus separados.
      out.push({ nome: `Ajuste próprio${escopo}`, de: 'criado', para: `${dias(d.lambda)}, ${bonus(d.boostConversao)}` })
      continue
    }
    if (!antes || antes.lambda !== d.lambda) {
      out.push({ nome: `Meia-vida${escopo}`, de: antes ? dias(antes.lambda) : '—', para: dias(d.lambda) })
    }
    if (!antes || antes.boostConversao !== d.boostConversao) {
      out.push({
        nome: `Bônus de categoria${escopo}`,
        de: antes ? bonus(antes.boostConversao) : '—',
        para: bonus(d.boostConversao),
      })
    }
  }
  return out
}

function ConfirmacaoConteudo({
  itens,
  onRecalcularChange,
}: {
  itens: Alteracao[]
  onRecalcularChange: (v: boolean) => void
}) {
  return (
    <Flex vertical gap={10}>
      <Typography.Text>
        Isso muda como a nota de interesse dos clientes é calculada: afeta o nível de interesse no dashboard, a lista de
        clientes com alto interesse e a ordem dos produtos recomendados.
      </Typography.Text>
      <Typography.Text strong>{itens.length === 1 ? '1 ajuste:' : `${itens.length} ajustes:`}</Typography.Text>
      <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 200, overflowY: 'auto' }}>
        {itens.map((a) => (
          <li key={a.nome}>
            {a.nome}: {a.de} → <strong>{a.para}</strong>
          </li>
        ))}
      </ul>
      <Checkbox defaultChecked onChange={(e) => onRecalcularChange(e.target.checked)}>
        Recalcular agora as notas de todos os clientes e visitantes
      </Checkbox>
    </Flex>
  )
}

export default function AdminConfiguracaoPage() {
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const { modal } = App.useApp()
  const [pesos, setPesos] = useState<PesoMetrica[]>([])
  const [decay, setDecay] = useState<ParametroDecay[]>([])
  /** Últimos valores salvos: base do "Desfazer", da prévia ("hoje") e da confirmação. */
  const [pesosSalvos, setPesosSalvos] = useState<PesoMetrica[]>([])
  const [decaySalvo, setDecaySalvo] = useState<ParametroDecay[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [aba, setAba] = useState<AbaConfig>('acoes')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) return
    const t = window.setTimeout(() => {
      void Promise.all([getPesos(), getDecay()])
        .then(([p, d]) => {
          setPesos(p)
          setDecay(d)
          setPesosSalvos(p)
          setDecaySalvo(d)
        })
        .finally(() => setLoading(false))
      // Só alimenta "Adicionar ajuste para uma categoria"; uma falha aqui não bloqueia a tela.
      void listCategorias()
        .then(setCategorias)
        .catch(() => setCategorias([]))
    }, 0)
    return () => window.clearTimeout(t)
  }, [isAdmin])

  const simulacao = useSimulacao(pesos, decay, isAdmin && !loading)

  if (authLoading || !isAdmin || loading) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    )
  }

  const alteracoes = listarAlteracoes(pesos, pesosSalvos, decay, decaySalvo)
  const global = decayGlobal(decay)
  const globalSalvo = decayGlobal(decaySalvo)
  const overrides = decay.filter((d) => d.categoriaId != null)
  const pesoMudou = (t: TipoEvento) =>
    pesos.find((p) => p.tipoEvento === t)?.peso !== pesosSalvos.find((p) => p.tipoEvento === t)?.peso
  /** Abas com alteração não salva (ponto no rótulo), já que os controles ficam escondidos nas outras abas. */
  const abaMudou: Record<AbaConfig, boolean> = {
    acoes: pesos.some((p) => EVENTOS_SCORING[p.tipoEvento]?.alvo !== 'categoria' && pesoMudou(p.tipoEvento)),
    duracao: global.lambda !== globalSalvo.lambda,
    categorias:
      pesoMudou('FILTRO_APLICADO') ||
      global.boostConversao !== globalSalvo.boostConversao ||
      JSON.stringify(overrides) !== JSON.stringify(decaySalvo.filter((d) => d.categoriaId != null)),
  }
  const rotuloAba = (k: AbaConfig, texto: string) => (
    <Badge dot={abaMudou[k]} offset={[6, 0]}>
      {texto}
    </Badge>
  )

  function alterarPeso(tipo: TipoEvento, peso: number) {
    setPesos((prev) => prev.map((p) => (p.tipoEvento === tipo ? { ...p, peso: Math.round(peso * 100) / 100 } : p)))
  }

  function alterarDecay(
    categoriaId: number | null,
    patch: Partial<Pick<ParametroDecay, 'lambda' | 'boostConversao'>>,
  ) {
    setDecay((prev) => {
      const existe = prev.some((d) => d.categoriaId === categoriaId)
      const base = existe ? prev : [...prev, { ...decayGlobal(prev), categoriaId: null }]
      return base.map((d) => (d.categoriaId === categoriaId ? { ...d, ...patch } : d))
    })
  }

  function adicionarOverride(c: Categoria) {
    setDecay((prev) => [...prev, { ...decayGlobal(prev), categoriaId: c.id, categoriaNome: c.nome }])
  }

  function removerOverride(categoriaId: number) {
    setDecay((prev) => prev.filter((d) => d.categoriaId !== categoriaId))
  }

  function restaurarPadrao() {
    setPesos((prev) =>
      prev.map((p) => ({ ...p, peso: PESOS_PADRAO.find((d) => d.tipoEvento === p.tipoEvento)?.peso ?? p.peso })),
    )
    alterarDecay(null, { lambda: LAMBDA_PADRAO, boostConversao: BOOST_PADRAO })
  }

  function salvar() {
    let recalcular = true
    const pesosMudaram = JSON.stringify(pesos) !== JSON.stringify(pesosSalvos)
    const decayMudou = JSON.stringify(decay) !== JSON.stringify(decaySalvo)
    modal.confirm({
      title: 'Salvar novos ajustes de interesse?',
      content: (
        <ConfirmacaoConteudo
          itens={alteracoes}
          onRecalcularChange={(v) => {
            recalcular = v
          }}
        />
      ),
      okText: 'Salvar ajustes',
      cancelText: 'Cancelar',
      centered: true,
      width: 520,
      onOk: async () => {
        try {
          if (pesosMudaram) await savePesos(pesos)
          for (const r of removidas(decay, decaySalvo)) {
            if (r.categoriaId != null) await removerDecayCategoria(r.categoriaId)
          }
          if (decayMudou) await saveDecay(decay)
          setPesosSalvos(pesos)
          setDecaySalvo(decay)
          if (recalcular) {
            const r = await recalcularScores()
            void message.success(`Ajustes salvos. Notas de ${r.recalculados} clientes e visitantes recalculadas.`)
          } else {
            void message.success('Ajustes salvos. As notas mudam conforme os clientes interagirem.')
          }
        } catch {
          void message.error('Não foi possível salvar. Tente novamente.')
        }
      },
    })
  }

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={12}>
        <Flex vertical gap={2}>
          <Title level={2} style={{ margin: 0 }} id="admin-config-title">
            Como o sistema mede o interesse
          </Title>
          <Typography.Text type="secondary">
            Ajuste o que conta como interesse e veja, antes de salvar, como ficariam seus clientes reais.
          </Typography.Text>
        </Flex>
        <Space wrap>
          <Button
            id="admin-config-desfazer"
            variant="outlined"
            icon={<UndoOutlined />}
            disabled={alteracoes.length === 0}
            onClick={() => {
              setPesos(pesosSalvos)
              setDecay(decaySalvo)
            }}
          >
            Desfazer
          </Button>
          <Popconfirm
            title="Restaurar os valores iniciais?"
            description="Pesos, meia-vida e bônus voltam ao padrão do sistema. Os ajustes por categoria são mantidos. Nada é salvo até você clicar em Salvar."
            okText="Restaurar"
            cancelText="Cancelar"
            onConfirm={restaurarPadrao}
          >
            <Button id="admin-config-padrao" variant="outlined" icon={<ReloadOutlined />}>
              Restaurar padrão
            </Button>
          </Popconfirm>
          <Button
            id="admin-config-salvar"
            color="primary"
            icon={<SaveOutlined />}
            disabled={alteracoes.length === 0}
            onClick={salvar}
          >
            {alteracoes.length > 0 ? `Salvar (${alteracoes.length})` : 'Salvar'}
          </Button>
        </Space>
      </Flex>

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} xl={14}>
          <Card
            size="small"
            activeTabKey={aba}
            onTabChange={(k) => setAba(k as AbaConfig)}
            tabList={[
              { key: 'acoes', label: rotuloAba('acoes', 'Ações do cliente') },
              { key: 'duracao', label: rotuloAba('duracao', 'Duração do interesse') },
              { key: 'categorias', label: rotuloAba('categorias', 'Categorias') },
            ]}
            styles={{ body: { padding: 20 } }}
          >
            {aba === 'acoes' && <PesosSecao pesos={pesos} onChange={alterarPeso} />}
            {aba === 'duracao' && (
              <MeiaVidaSecao
                lambdaSalvo={globalSalvo.lambda}
                lambda={global.lambda}
                onChange={(lambda) => alterarDecay(null, { lambda })}
              />
            )}
            {aba === 'categorias' && (
              <CategoriasSecao
                pesos={pesos}
                onPesoChange={alterarPeso}
                boost={global.boostConversao}
                onBoostChange={(boostConversao) => alterarDecay(null, { boostConversao })}
                overrides={overrides}
                global={global}
                idsSalvos={new Set(decaySalvo.flatMap((d) => (d.categoriaId != null ? [d.categoriaId] : [])))}
                categorias={categorias}
                onOverrideChange={(id, patch) => alterarDecay(id, patch)}
                onAdicionar={adicionarOverride}
                onRemover={removerOverride}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={10} style={{ position: 'sticky', top: 16 }}>
          <Previa aba={aba} data={simulacao.data} carregando={simulacao.carregando} erro={simulacao.erro} />
        </Col>
      </Row>
    </Flex>
  )
}
