import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { TERMOS } from '@/components/LegalConteudo'
import { PaginaLegal } from './PaginaLegal'

afterEach(cleanup)

it('Termos: cada item do índice aponta para uma seção', () => {
  const { container } = render(<PaginaLegal doc={TERMOS} />)
  const links = [...container.querySelectorAll<HTMLAnchorElement>('nav a')]
  expect(links.length).toBe(TERMOS.secoes.length)
  for (const a of links) expect(container.querySelector(a.getAttribute('href')!)).toBeTruthy()
})
