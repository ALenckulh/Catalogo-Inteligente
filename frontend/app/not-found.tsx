'use client'

import Link from 'next/link'
import { Button, Flex, Result } from '@/components/ui'

export default function NotFound() {
  return (
    <Flex justify="center" align="center" style={{ minHeight: '60vh', padding: 24 }}>
      <Result
        status="404"
        title="Página não encontrada"
        subTitle="O endereço não existe ou o produto foi removido."
        extra={
          <Flex gap="small" wrap="wrap" justify="center">
            <Link href="/">
              <Button color="primary" id="not-found-vitrine">
                Ir para a vitrine
              </Button>
            </Link>
            <Link href="/produtos">
              <Button id="not-found-catalogo">Ver catálogo</Button>
            </Link>
          </Flex>
        }
      />
    </Flex>
  )
}
