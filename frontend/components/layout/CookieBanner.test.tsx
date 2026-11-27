import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { getConta } from '@/lib/api/conta'
import {
  CookieConsentContext,
  type CookieConsentValue,
} from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/contexts/CurrentUser/CurrentUserContext', () => ({ useCurrentUser: vi.fn() }))
vi.mock('@/lib/api/conta', () => ({ getConta: vi.fn() }))

function logado(aceito: boolean) {
  vi.mocked(useCurrentUser).mockReturnValue({ user: { id: 7 }, loading: false } as never)
  vi.mocked(getConta).mockResolvedValue({
    usuario: { id: 7 },
    consentimentos: [{ tipo: 'COOKIES_COMPORTAMENTAIS', aceito }],
  } as never)
}

function renderBanner(overrides: Partial<CookieConsentValue> = {}) {
  const value: CookieConsentValue = {
    preferences: { level: 'essential', behavioral: false, decidedAt: null },
    needsDecision: true,
    acceptAll: vi.fn(),
    acceptEssential: vi.fn(),
    acceptCustom: vi.fn(),
    acceptIfUndecided: vi.fn(),
    canTrackBehavioral: false,
    ...overrides,
  }
  return {
    value,
    ...render(
      <CookieConsentContext.Provider value={value}>
        <CookieBanner />
      </CookieConsentContext.Provider>,
    ),
  }
}

afterEach(cleanup)

describe('CookieBanner', () => {
  beforeEach(() => {
    vi.mocked(getConta).mockReset()
    vi.mocked(useCurrentUser).mockReturnValue({ user: null, loading: false } as never)
  })

  it('renders nothing when decision already made', () => {
    const { container } = renderBanner({ needsDecision: false })
    expect(container).toBeEmptyDOMElement()
  })

  it('só tem o botão Aceitar cookies e continuar, que chama acceptAll', async () => {
    const user = userEvent.setup()
    const { value } = renderBanner()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Aceitar cookies e continuar' }))
    expect(value.acceptAll).toHaveBeenCalled()
    expect(getConta).not.toHaveBeenCalled()
  })

  it('conta que já aceitou: o navegador adota o aceite e o banner não aparece', async () => {
    logado(true)
    const { value } = renderBanner()
    // Oculto enquanto consulta a conta; depois o aceite fecha o banner (needsDecision vira false).
    expect(screen.queryByRole('button', { name: 'Aceitar cookies e continuar' })).toBeNull()
    await waitFor(() => expect(value.acceptCustom).toHaveBeenCalledWith(true))
  })

  it('conta que recusou: mostra o banner e não aceita sozinho', async () => {
    logado(false)
    const { value } = renderBanner()
    expect(await screen.findByRole('button', { name: 'Aceitar cookies e continuar' })).toBeTruthy()
    expect(value.acceptCustom).not.toHaveBeenCalled()
  })
})
