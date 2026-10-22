'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { displayName } from '@/lib/api/auth'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { Button, Flex, Layout, Space } from '@/components/ui'

const { Header } = Layout

const NAV = [
  { href: '/produtos', label: 'Catálogo' },
  { href: '/sobre', label: 'Sobre' },
] as const

export function PublicHeader() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout, loading } = useCurrentUser()

  return (
    <Header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        paddingInline: 24,
        background: 'var(--surface-base)',
        borderBottom: '1px solid var(--border-neutral-subtle)',
        height: 64,
        lineHeight: '64px',
      }}
    >
      <Flex align="center" justify="space-between" style={{ maxWidth: 1152, margin: '0 auto', height: '100%' }}>
        <Flex align="center" gap="large">
          <Link
            href="/"
            id="header-logo"
            style={{ textDecoration: 'none', color: 'var(--text-neutral-strong)', fontWeight: 600, fontSize: 16 }}
          >
            Catálogo Inteligente
          </Link>
          <nav aria-label="Principal">
            <Space size="middle">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`header-nav-${item.href.replace('/', '') || 'home'}`}
                    style={{
                      color: active ? 'var(--primary)' : 'var(--text-neutral-default)',
                      textDecoration: 'none',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </Space>
          </nav>
        </Flex>

        {!loading && (
          <Space size="small">
            {isAuthenticated && user ? (
              <>
                <Link href="/favoritos" id="header-favoritos" style={{ textDecoration: 'none' }}>
                  <Button variant="text">Favoritos</Button>
                </Link>
                <Link href="/conta" id="header-conta" style={{ textDecoration: 'none' }}>
                  <Button variant="text">{displayName(user)}</Button>
                </Link>
                <Button id="header-sair" variant="outlined" onClick={() => void logout()}>
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link href="/entrar" id="header-entrar" style={{ textDecoration: 'none' }}>
                  <Button variant="text">Entrar</Button>
                </Link>
                <Link href="/cadastro" id="header-cadastrar" style={{ textDecoration: 'none' }}>
                  <Button color="primary">Cadastrar</Button>
                </Link>
              </>
            )}
          </Space>
        )}
      </Flex>
    </Header>
  )
}
