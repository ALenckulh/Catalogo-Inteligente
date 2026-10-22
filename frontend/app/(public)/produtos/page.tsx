import { Suspense } from 'react'
import { Flex, Spin } from '@/components/ui'
import { ProdutosCatalogo } from './ProdutosCatalogo'

export default function ProdutosPage() {
  return (
    <Suspense
      fallback={
        <Flex justify="center" style={{ padding: 64 }}>
          <Spin size="large" />
        </Flex>
      }
    >
      <ProdutosCatalogo />
    </Suspense>
  )
}
