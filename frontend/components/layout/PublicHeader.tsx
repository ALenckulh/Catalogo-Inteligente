'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MenuOutlined } from '@ant-design/icons'
import { displayName } from '@/lib/api/auth'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { useTrackEvent } from '@/lib/hooks/useTrackEvent'
import { entrarHref } from '@/lib/navigation'
import { Button, Drawer, Flex, Input, Layout, Space, Typography } from '@/components/ui'

const { Header } = Layout
const { Text } = Typography

const NAV = [
  { href: '/produtos', label: 'Catálogo' },
  { href: '/sobre', label: 'Sobre' },
] as const

const ROTAS_AUTH = ['/entrar', '/cadastro', '/recuperar-senha']

function EntrarLink({ id, block }: { id: string; block?: boolean }) {
  const pathname = usePathname()
  const qs = useSearchParams().toString()
  const href = ROTAS_AUTH.includes(pathname)
    ? '/entrar'
    : entrarHref(qs ? `${pathname}?${qs}` : pathname)
  return (
    <Button id={id} variant="text" href={href} block={block}>
      Entrar
    </Button>
  )
}

function HeaderBusca() {
  const router = useRouter()
  const track = useTrackEvent()
  return (
    <Input.Search
      id="header-busca"
      aria-label="Buscar produtos"
      placeholder="Buscar produtos"
      allowClear
      style={{ width: 240 }}
      onSearch={(value, _e, info) => {
        const termo = value.trim()
        if (info?.source === 'clear' || !termo) return
        track({ tipo: 'PESQUISA', metadados: { termo } })
        router.push(`/produtos?q=${encodeURIComponent(termo)}`)
      }}
    />
  )
}

function HeaderAcoes({ idPrefix, block }: { idPrefix: string; block?: boolean }) {
  const { user, isAuthenticated } = useCurrentUser()

  if (isAuthenticated && user) {
    const nome = displayName(user)
    return (
      <>
        <Button id={`${idPrefix}-favoritos`} variant="text" href="/favoritos" block={block}>
          Favoritos
        </Button>
        <Button id={`${idPrefix}-conta`} variant="text" href="/conta" block={block}>
          <Text ellipsis={{ tooltip: nome }} style={{ maxWidth: 160 }}>
            {nome}
          </Text>
        </Button>
      </>
    )
  }

  return (
    <>
      <Suspense
        fallback={
          <Button variant="text" href="/entrar" block={block}>
            Entrar
          </Button>
        }
      >
        <EntrarLink id={`${idPrefix}-entrar`} block={block} />
      </Suspense>
      <Button id={`${idPrefix}-cadastrar`} href="/cadastro" block={block}>
        Cadastrar
      </Button>
    </>
  )
}

export function PublicHeader() {
  const pathname = usePathname()
  const { loading } = useCurrentUser()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-navigation)',
        width: '100%',
        paddingInline: 0,
        background: 'var(--surface-base)',
        borderBottom: 'var(--border-width-default) solid var(--border-neutral-subtle)',
        height: 'var(--header-height)',
        lineHeight: 'var(--line-height-normal)',
      }}
    >
      <Flex className="shell-inner" align="center" justify="space-between" gap="middle" style={{ height: '100%' }}>
        <Flex align="center" gap="large">
          <Link
            href="/"
            id="header-logo"
            style={{
              textDecoration: 'none',
              color: 'var(--text-neutral-strong)',
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-xl)',
              whiteSpace: 'nowrap',
            }}
          >
            Catálogo Inteligente
          </Link>
          <nav aria-label="Principal" className="hide-below-md">
            <Space size="middle">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`header-nav-${item.href.replace('/', '') || 'home'}`}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      color: active ? 'var(--primary)' : 'var(--text-neutral-default)',
                      textDecoration: 'none',
                      fontWeight: active ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                    }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </Space>
          </nav>
        </Flex>

        <Flex align="center" gap="small">
          {pathname !== '/produtos' && (
            <div className="hide-below-lg">
              <HeaderBusca />
            </div>
          )}
          {!loading && (
            <Flex align="center" gap="small" className="hide-below-md">
              <HeaderAcoes idPrefix="header" />
            </Flex>
          )}
          <Button
            id="header-menu"
            className="hide-from-md"
            variant="text"
            icon={<MenuOutlined />}
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
          />
        </Flex>
      </Flex>

      <Drawer title="Menu" placement="right" size={280} open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Flex vertical gap="small" onClick={() => setMenuOpen(false)}>
          {NAV.map((item) => (
            <Button key={item.href} id={`menu-nav-${item.href.replace('/', '')}`} variant="text" href={item.href} block>
              {item.label}
            </Button>
          ))}
          {!loading && <HeaderAcoes idPrefix="menu" block />}
        </Flex>
      </Drawer>
    </Header>
  )
}
