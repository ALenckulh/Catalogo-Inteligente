'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAdminProduto } from '@/lib/api/admin'
import { useRequireAdmin } from '@/lib/hooks/useRequireAdmin'
import type { Produto } from '@/lib/types'
import { Flex, Spin, Typography } from '@/components/ui'
import { ProdutoForm } from '../../_components/ProdutoForm'

const { Title } = Typography

export default function AdminProdutoEditarPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const { isAdmin, loading: authLoading } = useRequireAdmin()
  const [produto, setProduto] = useState<Produto | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    const t = window.setTimeout(() => {
      void getAdminProduto(id).then(setProduto)
    }, 0)
    return () => window.clearTimeout(t)
  }, [isAdmin, id])

  if (authLoading || !isAdmin || !produto) {
    return (
      <Flex justify="center" style={{ padding: 48 }}>
        <Spin />
      </Flex>
    )
  }

  return (
    <Flex vertical gap={16}>
      <Title level={3} style={{ margin: 0 }} id="admin-prod-editar-title">
        Editar produto
      </Title>
      <ProdutoForm initial={produto} />
    </Flex>
  )
}
