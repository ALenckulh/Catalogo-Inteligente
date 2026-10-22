import { Suspense } from 'react'
import { Flex, Spin } from '@/components/ui'
import { EntrarForm } from './EntrarForm'

export default function EntrarPage() {
  return (
    <Flex justify="center" style={{ padding: '48px 24px' }}>
      <Suspense fallback={<Spin />}>
        <EntrarForm />
      </Suspense>
    </Flex>
  )
}
