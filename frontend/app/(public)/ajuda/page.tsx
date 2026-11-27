'use client'

import { Ajuda } from '@/components/Ajuda'
import { Flex, Typography } from '@/components/ui'

const { Title } = Typography

/** Pública: quem não consegue entrar ou criar a conta também precisa dela. */
export default function AjudaPage() {
  return (
    <Flex vertical className="page page--narrow" style={{ gap: 'var(--space-4)' }}>
      <Title level={1} id="ajuda-title" style={{ margin: 0 }}>
        Ajuda
      </Title>
      <Ajuda />
    </Flex>
  )
}
