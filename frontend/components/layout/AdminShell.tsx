'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BgColorsOutlined,
  DashboardOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
} from '@ant-design/icons'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { Button, Flex, Layout, Menu, Typography } from '@/components/ui'
import type { MenuProps } from 'antd'

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
  const router = useRouter()
  const { user, isAdmin, logout, loading } = useCurrentUser()

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
        style={{ background: 'var(--surface-base)', borderRight: '1px solid var(--border-neutral-subtle)' }}
      >
        <div style={{ padding: '16px 20px' }}>
          <Text strong style={{ fontSize: 14 }}>
            Catálogo Inteligente
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Admin
          </Text>
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
                <Flex gap="small" align="center">
                  <Text type="secondary">{user.email}</Text>
                  <Button
                    id="admin-logout"
                    variant="text"
                    icon={<LogoutOutlined />}
                    tooltip="Sair"
                    onClick={() => {
                      void logout().then(() => router.push('/admin/entrar'))
                    }}
                  />
                </Flex>
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
