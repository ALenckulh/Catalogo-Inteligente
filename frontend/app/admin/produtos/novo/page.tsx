'use client'

import { Flex, Spin, Typography } from '@/components/ui'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import { ProdutoForm } from '../_components/ProdutoForm'

const { Title } = Typography

export default function AdminProdutoNovoPage() {
  const { isAdmin, loading } = useRequireAdmin()
  if (loading || !isAdmin) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    )
  }
  return (
    <Flex vertical gap={16}>
      <Title level={3} style={{ margin: 0 }} id="admin-prod-novo-title">
        Novo produto
      </Title>
      <ProdutoForm />
    </Flex>
  )
}
