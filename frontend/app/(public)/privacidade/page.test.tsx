import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PRIVACIDADE } from '@/components/LegalConteudo'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import PrivacidadePage from './page'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/contexts/CookieConsent/CookieConsentContext', () => ({ useCookieConsent: vi.fn() }))
vi.mock('@/lib/contexts/CurrentUser/CurrentUserContext', () => ({ useCurrentUser: vi.fn() }))

const acceptCustom = vi.fn()

function abrir(logado: boolean) {
  vi.mocked(useCurrentUser).mockReturnValue({ isAuthenticated: logado, loading: false } as never)
  vi.mocked(useCookieConsent).mockReturnValue({ canTrackBehavioral: true, acceptCustom } as never)
  return render(<PrivacidadePage />)
}
afterEach(cleanup)

it('mostra a Política no formato do modal do cadastro, com h1', () => {
  abrir(false)
  expect(screen.getByRole('heading', { level: 1, name: PRIVACIDADE.titulo })).toBeTruthy()
})

it('numera seções, itens e alíneas no formato ABNT, com ponto e vírgula e ponto final', () => {
  abrir(false)
  expect(screen.getByRole('heading', { level: 2, name: '2 Dados tratados' })).toBeTruthy()
  expect(screen.getByText('2.1')).toBeTruthy()
  const alineas = PRIVACIDADE.secoes[1].itens[0].alineas!
  expect(screen.getByText(`a) ${alineas[0]};`)).toBeTruthy()
  expect(screen.getByText(`d) ${alineas[3]}.`)).toBeTruthy()
})

it('quem não tem conta desliga os cookies deste navegador', () => {
  abrir(false)
  fireEvent.click(screen.getByRole('switch'))
  expect(acceptCustom.mock.calls[0][0]).toBe(false)
})

it('quem tem conta vai para a aba Privacidade', () => {
  abrir(true)
  expect(screen.queryByRole('switch')).toBeNull()
  expect(screen.getByRole('link', { name: 'Abrir minhas escolhas' }).getAttribute('href')).toBe(
    '/conta?aba=privacidade',
  )
})
