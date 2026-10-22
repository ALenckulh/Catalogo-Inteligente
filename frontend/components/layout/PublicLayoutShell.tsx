'use client'

import { Layout } from '@/components/ui'
import { PublicHeader } from '@/components/layout/PublicHeader'
import { PublicFooter } from '@/components/layout/PublicFooter'

const { Content } = Layout

interface Props {
  children: React.ReactNode
}

export function PublicLayoutShell({ children }: Props) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo
      </a>
      <PublicHeader />
      <Content id="main-content" style={{ flex: 1 }}>
        {children}
      </Content>
      <PublicFooter />
    </Layout>
  )
}
