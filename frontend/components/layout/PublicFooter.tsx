'use client'

import Link from 'next/link'
import { Divider, Flex, Layout, Space, Typography } from '@/components/ui'

const { Footer } = Layout
const { Text } = Typography

const LINKS = [
  { href: '/produtos', label: 'Catálogo' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/termos', label: 'Termos de Uso' },
] as const

export function PublicFooter() {
  return (
    <Footer
      role="contentinfo"
      style={{
        paddingInline: 0,
        paddingBlock: 'var(--space-6)',
        background: 'var(--surface-neutral-subtle)',
        borderTop: 'var(--border-width-default) solid var(--border-neutral-subtle)',
      }}
    >
      <Flex vertical gap="middle" className="shell-inner">
        <Flex justify="space-between" wrap="wrap" gap="middle">
          <Text strong>Catálogo Inteligente</Text>
          <nav aria-label="Rodapé">
            <Space size="large" wrap>
              {LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`footer-link-${item.href.replace('/', '')}`}
                  style={{ color: 'var(--text-neutral-default)', textDecoration: 'none' }}
                >
                  {item.label}
                </Link>
              ))}
            </Space>
          </nav>
        </Flex>
        <Divider style={{ margin: 0 }} />
        <Text type="secondary" style={{ fontSize: 'var(--font-size-base)' }}>
          © {new Date().getFullYear()} Catálogo Inteligente · Uso acadêmico (TCC)
        </Text>
      </Flex>
    </Footer>
  )
}
