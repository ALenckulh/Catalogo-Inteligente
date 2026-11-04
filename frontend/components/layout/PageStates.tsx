'use client'

import { Button, Flex, Result, Spin } from '@/components/ui'

export function PageLoading() {
  return (
    <Flex justify="center" style={{ padding: 'var(--space-16)' }}>
      <Spin size="large" />
    </Flex>
  )
}

interface PageErrorProps {
  onRetry: () => void
}

export function PageError({ onRetry }: PageErrorProps) {
  return (
    <Result
      status="error"
      title="Não foi possível carregar"
      subTitle="Verifique sua conexão e tente novamente."
      extra={
        <Button color="primary" onClick={onRetry}>
          Tentar novamente
        </Button>
      }
    />
  )
}
