import { Suspense } from 'react'
import { PageLoading } from '@/components/layout/PageStates'
import { ContaTela } from './_components/ContaTela'

/** `ContaTela` guarda a aba ativa na URL (`useSearchParams`), por isso fica dentro de Suspense. */
export default function ContaPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ContaTela />
    </Suspense>
  )
}
