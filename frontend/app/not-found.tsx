'use client'

import { Button, Flex, Result, Typography } from '@/components/ui'
import { PublicLayoutShell } from '@/components/layout/PublicLayoutShell'

const { Title } = Typography

export default function NotFound() {
  return (
    <PublicLayoutShell>
      <Result
        status="404"
        title={
          <Title level={1} style={{ margin: 0 }}>
            Página não encontrada
          </Title>
        }
        subTitle="O endereço não existe ou o produto foi removido."
        extra={
          <Flex gap="small" wrap="wrap" justify="center">
            <Button color="primary" id="not-found-vitrine" href="/">
              Ir para a vitrine
            </Button>
            <Button id="not-found-catalogo" href="/produtos">
              Ver catálogo
            </Button>
          </Flex>
        }
      />
    </PublicLayoutShell>
  )
}
