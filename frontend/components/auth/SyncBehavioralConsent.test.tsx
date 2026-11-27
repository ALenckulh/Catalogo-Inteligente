import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getConta, updateConsentimentos } from '@/lib/api/conta'
import { VERSAO_TERMOS } from '@/lib/config'
import { marcarContaDecidida } from '@/lib/consentSync'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { SyncBehavioralConsent } from './SyncBehavioralConsent'

vi.mock('@/lib/api/config', async (original) => ({ ...(await original<object>()), USE_MOCK: false }))
vi.mock('@/lib/api/conta', () => ({ getConta: vi.fn(), updateConsentimentos: vi.fn() }))
vi.mock('@/lib/contexts/CookieConsent/CookieConsentContext', () => ({ useCookieConsent: vi.fn() }))
vi.mock('@/lib/contexts/CurrentUser/CurrentUserContext', () => ({ useCurrentUser: vi.fn() }))

let id = 100

function cenario(aceitoNaConta: boolean | null, navegador: boolean, decidiu = true) {
  // Um id por teste: a marca em memória dura o módulo inteiro.
  id += 1
  const consentimentos =
    aceitoNaConta === null ? [] : [{ tipo: 'COOKIES_COMPORTAMENTAIS', aceito: aceitoNaConta }]
  vi.mocked(getConta).mockResolvedValue({ usuario: {}, consentimentos } as never)
  vi.mocked(updateConsentimentos).mockResolvedValue([])
  vi.mocked(useCurrentUser).mockReturnValue({ user: { id }, isAuthenticated: true } as never)
  vi.mocked(useCookieConsent).mockReturnValue({
    canTrackBehavioral: navegador,
    preferences: { decidedAt: decidiu ? '2026-01-01' : null },
  } as never)
}

beforeEach(() => {
  window.localStorage.clear()
  vi.mocked(getConta).mockReset()
  vi.mocked(updateConsentimentos).mockReset()
})
afterEach(cleanup)

it.each([
  [true, false],
  [false, true],
])('conta que já decidiu (%s) não muda com o navegador (%s)', async (conta, navegador) => {
  cenario(conta, navegador)
  const { unmount } = render(<SyncBehavioralConsent />)
  await waitFor(() => expect(window.localStorage.getItem('ci_consent_synced')).toBe(String(id)))
  unmount()
  render(<SyncBehavioralConsent />)
  expect(getConta).toHaveBeenCalledTimes(1)
  expect(updateConsentimentos).not.toHaveBeenCalled()
})

it.each([true, false])('conta que nunca decidiu recebe a escolha do navegador (%s)', async (navegador) => {
  cenario(null, navegador)
  render(<SyncBehavioralConsent />)
  await waitFor(() =>
    expect(updateConsentimentos).toHaveBeenCalledWith(id, [
      { tipo: 'COOKIES_COMPORTAMENTAIS', aceito: navegador, versaoTermos: VERSAO_TERMOS },
    ]),
  )
})

it('navegador sem escolha não consulta nada', () => {
  cenario(null, false, false)
  render(<SyncBehavioralConsent />)
  expect(getConta).not.toHaveBeenCalled()
})

it('troca em /conta durante a consulta não é desfeita', async () => {
  cenario(null, true)
  vi.mocked(getConta).mockImplementation(async () => {
    marcarContaDecidida(id)
    return { usuario: {}, consentimentos: [] } as never
  })
  render(<SyncBehavioralConsent />)
  await waitFor(() => expect(getConta).toHaveBeenCalled())
  await new Promise((r) => setTimeout(r, 20))
  expect(updateConsentimentos).not.toHaveBeenCalled()
})
