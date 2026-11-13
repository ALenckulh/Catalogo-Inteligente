import { Suspense } from 'react'
import { PageLoading } from '@/components/layout/PageStates'
import { UsuariosLista } from './_components/UsuariosLista'

/** `UsuariosLista` lê filtros da URL (`useSearchParams`), por isso fica dentro de Suspense. */
export default function AdminUsuariosPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <UsuariosLista />
    </Suspense>
  )
}
