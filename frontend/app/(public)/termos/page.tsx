'use client'

import { TermosConteudo } from '@/components/LegalConteudo'
import { Typography } from '@/components/ui'

const { Title } = Typography

export default function TermosPage() {
  return (
    <article aria-labelledby="termos-title" className="page page--narrow page--prose">
      <Title id="termos-title" level={1}>
        Termos de Uso
      </Title>
      <TermosConteudo />
    </article>
  )
}
