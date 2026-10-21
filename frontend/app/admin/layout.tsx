import { Layout } from '@/components/ui'

const { Sider, Content } = Layout

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={240} />
      <Layout>
        <Content>{children}</Content>
      </Layout>
    </Layout>
  )
}
