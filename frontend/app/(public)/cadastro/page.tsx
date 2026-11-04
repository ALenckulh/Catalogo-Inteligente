import { Suspense } from 'react'
import { PageLoading } from '@/components/layout/PageStates'
import { Flex } from '@/components/ui'
import { CadastroForm } from './CadastroForm'

export default function CadastroPage() {
  return (
    <Flex vertical className="page page--auth">
      <Suspense fallback={<PageLoading />}>
        <CadastroForm />
      </Suspense>
    </Flex>
  )
}
