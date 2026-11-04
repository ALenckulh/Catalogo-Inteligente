import { Suspense } from 'react'
import { PageLoading } from '@/components/layout/PageStates'
import { Flex } from '@/components/ui'
import { EntrarForm } from './EntrarForm'

export default function EntrarPage() {
  return (
    <Flex vertical className="page page--auth">
      <Suspense fallback={<PageLoading />}>
        <EntrarForm />
      </Suspense>
    </Flex>
  )
}
