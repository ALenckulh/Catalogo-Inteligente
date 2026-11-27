'use client'

import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  ToolOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons'
import Image from 'next/image'
import { Logo } from '@/components/layout/Logo'
import { Button, Card, Col, Flex, Row, Typography } from '@/components/ui'
import { EMPRESA, whatsappUrl } from '@/lib/config'

const { Title, Paragraph, Text, Link } = Typography

const MAPA_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EMPRESA.endereco)}`

const SERVICOS = [
  { titulo: 'Retífica de motores', descricao: 'Recuperação completa de motores a gasolina, álcool, flex e diesel.' },
  { titulo: 'Retífica de cabeçotes', descricao: 'Plaina, assentamento de válvulas, troca de guias e teste de estanqueidade.' },
  { titulo: 'Retífica de virabrequim', descricao: 'Retífica de colos e moentes, com medição dentro da tolerância de fábrica.' },
  { titulo: 'Bloco do motor', descricao: 'Brunimento e encamisamento de cilindros e retífica de mancais.' },
  { titulo: 'Montagem de motores', descricao: 'Montagem com torque e folgas conferidos, pronta para instalar.' },
]

const PRODUTOS = [
  {
    titulo: 'Peças para motores',
    descricao: 'Pistões, anéis, bronzinas, bielas, juntas, válvulas, guias e retentores para motores a gasolina, álcool, flex e diesel.',
  },
  {
    titulo: 'Óleos e lubrificantes',
    descricao: 'Óleos de motor para gasolina, flex e diesel, aditivos e lubrificantes. Indicamos a especificação certa para cada motor.',
  },
  {
    titulo: 'Motores retificados',
    descricao: 'Recuperados na nossa oficina, com medidas conferidas e prontos para instalar.',
  },
  {
    titulo: 'Meio motor e usados revisados',
    descricao:
      'Bloco montado com virabrequim, pistões e bielas, ou motor usado revisado antes da venda: opções mais econômicas.',
  },
]

const CONTATOS = [
  { icon: <PhoneOutlined />, titulo: 'Telefone', conteudo: <Link href={EMPRESA.telefoneHref}>{EMPRESA.telefone}</Link> },
  {
    icon: <MailOutlined />,
    titulo: 'E-mail',
    conteudo: <Link href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</Link>,
  },
  {
    icon: <ClockCircleOutlined />,
    titulo: 'Horário',
    conteudo: (
      <>
        <Text>{EMPRESA.horario.dias}</Text>
        <br />
        <Text type="secondary">{EMPRESA.horario.horas}</Text>
      </>
    ),
  },
  {
    icon: <EnvironmentOutlined />,
    titulo: 'Endereço',
    conteudo: (
      <>
        <Text>{EMPRESA.endereco}</Text>
        <br />
        <Link href={MAPA_URL} target="_blank" rel="noopener noreferrer">
          Ver no mapa
        </Link>
      </>
    ),
  },
]

const ICONE = { fontSize: 'var(--font-size-xl)', color: 'var(--primary)' } as const

const WHATSAPP = whatsappUrl('Olá! Vim pelo site da Renova Retífica e gostaria de um orçamento.')

const ATENDEMOS = [
  {
    titulo: 'Carros de passeio',
    descricao: 'Motores a gasolina, álcool e flex.',
    src: '/fotos/CARRO_COM_CAPO_ABERTO.jpg',
    alt: 'Carro com o capô aberto na oficina',
  },
  {
    titulo: 'Caminhões e utilitários',
    descricao: 'Motores diesel leves e pesados.',
    src: '/fotos/CAMINHOES.jpg',
    alt: 'Caminhões estacionados lado a lado',
  },
]

interface FotoProps {
  src: string
  alt: string
  sizes: string
  /** Sem ratio, ocupa a altura do contêiner. */
  ratio?: string
  position?: string
  preload?: boolean
}

function Foto({ src, alt, sizes, ratio, position, preload }: FotoProps) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        ...(ratio ? { aspectRatio: ratio } : { height: '100%', minHeight: 320 }),
      }}
    >
      <Image src={src} alt={alt} fill sizes={sizes} preload={preload} style={{ objectFit: 'cover', objectPosition: position }} />
    </div>
  )
}

export default function SobrePage() {
  return (
    <Flex vertical gap={48} className="page">
      <section aria-labelledby="sobre-title">
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} lg={12}>
            <Flex vertical gap="middle" align="flex-start">
              <Logo size="lg" iconOnly />
              <Title id="sobre-title" level={1} style={{ margin: 0 }}>
                {EMPRESA.nome}
              </Title>
              <Paragraph type="secondary" style={{ maxWidth: 560, margin: 0, fontSize: 'var(--font-size-lg)' }}>
                Peças, óleos, lubrificantes e motores para carros, caminhões, máquinas agrícolas e embarcações, com
                retífica completa em Jaraguá do Sul, SC, desde 2020.
              </Paragraph>
              <Text type="secondary">Enviamos para outras cidades. Orçamento sem compromisso.</Text>
              <Flex gap="small" wrap="wrap">
                <Button color="primary" id="sobre-ver-catalogo" href="/produtos">
                  Ver catálogo
                </Button>
                <Button id="sobre-whatsapp" icon={<WhatsAppOutlined />} href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                  Pedir orçamento no WhatsApp
                </Button>
              </Flex>
            </Flex>
          </Col>
          <Col xs={24} lg={12}>
            <Foto
              src="/fotos/MECANICO.jpg"
              alt="Mecânico verificando o óleo do motor na oficina"
              sizes="(min-width: 992px) 600px, 100vw"
              ratio="4 / 3"
              position="center 30%"
              preload
            />
          </Col>
        </Row>
      </section>

      <section aria-labelledby="venda-title">
        <Title id="venda-title" level={2}>
          Peças, óleos e motores
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 720 }}>
          Tudo o que o motor precisa, da peça de reposição ao motor completo. Consulte disponibilidade e prazo de envio
          pelo WhatsApp.
        </Paragraph>
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={0} lg={8}>
            <Foto src="/fotos/MOTOR.jpg" alt="Motor de carro visto de perto" sizes="400px" />
          </Col>
          <Col xs={24} lg={16}>
            <Flex vertical gap="middle">
              <Row gutter={[16, 16]}>
                {PRODUTOS.map((p) => (
                  <Col key={p.titulo} xs={24} sm={12}>
                    <Card style={{ height: '100%' }}>
                      <Flex vertical gap="small">
                        <ShopOutlined aria-hidden style={ICONE} />
                        <Text strong>{p.titulo}</Text>
                        <Text type="secondary">{p.descricao}</Text>
                      </Flex>
                    </Card>
                  </Col>
                ))}
              </Row>
              <Flex gap="middle" align="center" wrap="wrap">
                <Button color="primary" id="sobre-venda-ver-catalogo" href="/produtos">
                  Ver catálogo
                </Button>
                <Text type="secondary">Enviamos para outras cidades · Orçamento sem compromisso</Text>
              </Flex>
            </Flex>
          </Col>
        </Row>
      </section>

      <section aria-labelledby="servicos-title">
        <Title id="servicos-title" level={2}>
          Serviços
        </Title>
        <Paragraph type="secondary" style={{ maxWidth: 720 }}>
          Retífica completa feita na nossa oficina, para motores de carros, caminhões, máquinas agrícolas, embarcações e
          motores estacionários.
        </Paragraph>
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} lg={16}>
            <Row gutter={[16, 16]}>
              {SERVICOS.map((s) => (
                <Col key={s.titulo} xs={24} sm={12}>
                  <Card style={{ height: '100%' }}>
                    <Flex vertical gap="small">
                      <ToolOutlined aria-hidden style={ICONE} />
                      <Text strong>{s.titulo}</Text>
                      <Text type="secondary">{s.descricao}</Text>
                    </Flex>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
          {/* Só no desktop: no mobile viraria uma faixa recortada entre os cards. */}
          <Col xs={0} lg={8}>
            <Foto src="/fotos/MECANICO2.jpg" alt="Mecânico de luvas montando um motor" sizes="400px" />
          </Col>
        </Row>
      </section>

      <section aria-labelledby="atendemos-title">
        <Title id="atendemos-title" level={2}>
          Motores que atendemos
        </Title>
        <Row gutter={[16, 24]}>
          {ATENDEMOS.map((a) => (
            <Col key={a.titulo} xs={24} md={12}>
              <Flex vertical gap="small">
                <Foto src={a.src} alt={a.alt} sizes="(min-width: 768px) 600px, 100vw" ratio="3 / 2" />
                <Text strong>{a.titulo}</Text>
                <Text type="secondary">{a.descricao}</Text>
              </Flex>
            </Col>
          ))}
        </Row>
        <Paragraph type="secondary" style={{ marginTop: 'var(--space-6)', marginBottom: 0 }}>
          Também trabalhamos com motores de máquinas agrícolas, embarcações e motores estacionários de máquinas.
        </Paragraph>
      </section>

      <Card>
        <Row gutter={[32, 24]} align="middle">
          <Col xs={24} md={10}>
            <Foto
              src="/fotos/MULHER_E_CARRO_QUEBRADO.jpg"
              alt="Motorista ao telefone ao lado do carro com o capô aberto"
              sizes="(min-width: 768px) 480px, 100vw"
              ratio="4 / 3"
              position="70% center"
            />
          </Col>
          <Col xs={24} md={14}>
            <Flex vertical gap="middle" align="flex-start">
              <Title level={2} style={{ margin: 0 }}>
                Motor deu problema?
              </Title>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                Mande o modelo do motor pelo WhatsApp e receba um orçamento sem compromisso. Enviamos peças e motores
                para outras cidades.
              </Paragraph>
              <Button
                color="primary"
                id="sobre-cta-whatsapp"
                icon={<WhatsAppOutlined />}
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar no WhatsApp
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      <section aria-labelledby="contato-title">
        <Title id="contato-title" level={2}>
          Contato e horário
        </Title>
        <Row gutter={[16, 16]}>
          {CONTATOS.map((c) => (
            <Col key={c.titulo} xs={24} sm={12} lg={6}>
              <Card style={{ height: '100%' }}>
                <Flex vertical gap="small">
                  <span aria-hidden style={ICONE}>
                    {c.icon}
                  </span>
                  <Text strong>{c.titulo}</Text>
                  <div>{c.conteudo}</div>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </Flex>
  )
}
