'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BgColorsOutlined,
  DashboardOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
  LoginOutlined,
  ReadOutlined,
} from '@ant-design/icons'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { Button, Flex, Layout, Menu, Typography } from '@/components/ui'
import type { MenuProps } from 'antd'
import { Logo } from './Logo'

const { Sider, Content, Header } = Layout
const { Text } = Typography

const MENU_ITEMS: MenuProps['items'] = [
  { key: '/admin', icon: <DashboardOutlined />, label: <Link href="/admin">Dashboard</Link> },
  {
    key: '/admin/usuarios',
    icon: <TeamOutlined />,
    label: <Link href="/admin/usuarios">Usuários</Link>,
  },
  {
    key: '/admin/produtos',
    icon: <ShoppingOutlined />,
    label: <Link href="/admin/produtos">Produtos</Link>,
  },
  {
    key: '/admin/configuracao',
    icon: <SettingOutlined />,
    label: <Link href="/admin/configuracao">Configuração</Link>,
  },
  {
    key: '/admin/projeto',
    icon: <ReadOutlined />,
    label: <Link href="/admin/projeto">Sobre o projeto</Link>,
  },
  {
    key: '/admin/design-system',
    icon: <BgColorsOutlined />,
    label: <Link href="/admin/design-system">Design system</Link>,
  },
  {
    key: '/admin/conta',
    icon: <UserOutlined />,
    label: <Link href="/admin/conta">Conta</Link>,
  },
]

interface Props {
  children: React.ReactNode
}

export function AdminShell({ children }: Props) {
  const pathname = usePathname()
  const [recolhido, setRecolhido] = useState(false)
  const { user, isAdmin, loading } = useCurrentUser()

  const isLoginPage = pathname === '/admin/entrar'

  if (isLoginPage) {
    return <>{children}</>
  }

  const selected =
    MENU_ITEMS?.map((i) => i?.key as string)
      .filter(Boolean)
      .filter((key) => pathname === key || (key !== '/admin' && pathname.startsWith(key)))
      .sort((a, b) => b.length - a.length)[0] ?? '/admin'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        breakpoint="lg"
        collapsedWidth={64}
        onCollapse={setRecolhido}
        style={{ background: 'var(--surface-base)', borderRight: '1px solid var(--border-neutral-subtle)' }}
      >
        {/* Recolhido (abaixo de 992px) só cabe o símbolo: o texto quebrava e invadia o cabeçalho. */}
        <div style={{ padding: recolhido ? '16px 18px' : '16px 20px' }}>
          <Logo size="sm" iconOnly={recolhido} />
          {!recolhido && (
            <Text type="secondary" style={{ display: 'block', fontSize: 'var(--font-size-base)' }}>
              Admin
            </Text>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selected]}
          items={MENU_ITEMS}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: 'var(--surface-base)',
            borderBottom: '1px solid var(--border-neutral-subtle)',
            paddingInline: 24,
            height: 56,
            lineHeight: '56px',
          }}
        >
          <Flex justify="flex-end" align="center" style={{ height: '100%' }}>
            {!loading &&
              (isAdmin && user ? (
                <Text type="secondary" ellipsis={{ tooltip: user.email }}>
                  {user.email}
                </Text>
              ) : (
                <Link href="/admin/entrar">
                  <Button id="admin-login-link" icon={<LoginOutlined />}>
                    Entrar
                  </Button>
                </Link>
              ))}
          </Flex>
        </Header>
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  )
}
