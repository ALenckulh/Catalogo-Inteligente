import { Suspense } from 'react'
import { PageLoading } from '@/components/layout/PageStates'
import { UsuarioDetalhe } from './_components/UsuarioDetalhe'

/** `UsuarioDetalhe` guarda a aba ativa na URL (`useSearchParams`), por isso fica dentro de Suspense. */
export default function AdminUsuarioDetalhePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <UsuarioDetalhe />
    </Suspense>
  )
}
