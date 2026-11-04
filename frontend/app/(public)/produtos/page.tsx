import { Suspense } from 'react'
import { PageLoading } from '@/components/layout/PageStates'
import { ProdutosCatalogo } from './ProdutosCatalogo'

export default function ProdutosPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ProdutosCatalogo />
    </Suspense>
  )
}
