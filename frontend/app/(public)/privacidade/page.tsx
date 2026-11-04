'use client'

import { PrivacidadeConteudo } from '@/components/LegalConteudo'
import { Typography } from '@/components/ui'

const { Title } = Typography

export default function PrivacidadePage() {
  return (
    <article aria-labelledby="privacidade-title" className="page page--narrow page--prose">
      <Title id="privacidade-title" level={1}>
        Política de Privacidade
      </Title>
      <PrivacidadeConteudo />
    </article>
  )
}
