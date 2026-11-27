import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { App } from '@/components/ui'
import { PRIVACIDADE, TERMOS } from '@/components/LegalConteudo'
import { useCookieConsent } from '@/lib/contexts/CookieConsent/CookieConsentContext'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { CadastroForm } from './CadastroForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/lib/contexts/CookieConsent/CookieConsentContext', () => ({ useCookieConsent: vi.fn() }))
vi.mock('@/lib/contexts/CurrentUser/CurrentUserContext', () => ({ useCurrentUser: vi.fn() }))

const signup = vi.fn()
const acceptIfUndecided = vi.fn()

beforeEach(() => {
  signup.mockReset().mockResolvedValue({})
  acceptIfUndecided.mockReset()
  vi.mocked(useCurrentUser).mockReturnValue({ signup, isAuthenticated: false, loading: false } as never)
  vi.mocked(useCookieConsent).mockReturnValue({ acceptIfUndecided } as never)
  render(
    <App>
      <CadastroForm />
    </App>,
  )
})
afterEach(cleanup)

const campo = (id: string) => document.getElementById(id) as HTMLInputElement
const aceite = () => campo('cadastro-termos')
const modal = async () => within(await screen.findByRole('dialog'))

async function aceitar() {
  fireEvent.click(aceite())
  fireEvent.click((await modal()).getByRole('button', { name: 'Li e aceito' }))
  await waitFor(() => expect(aceite().checked).toBe(true))
}

it('marcar abre o modal e só "Li e aceito" marca', async () => {
  fireEvent.click(aceite())
  await modal()
  expect(aceite().checked).toBe(false)
  fireEvent.click((await modal()).getByRole('button', { name: 'Li e aceito' }))
  await waitFor(() => expect(aceite().checked).toBe(true))
})

it('fechar o modal não marca', async () => {
  fireEvent.click(aceite())
  fireEvent.click((await modal()).getByRole('button', { name: 'Fechar' }))
  expect(aceite().checked).toBe(false)
})

it('desmarcar é direto, sem passar pelo modal', async () => {
  await aceitar()
  fireEvent.click(aceite())
  expect(aceite().checked).toBe(false)
})

it('o modal traz só os dois documentos inteiros, sem abas, com o aviso do que começa ligado na cláusula 4', async () => {
  fireEvent.click(aceite())
  const dialog = await modal()
  expect(dialog.queryByText('O que começa ligado na sua conta')).toBeNull()
  expect(dialog.getByText(/criada com recomendações personalizadas e contato comercial ativos/)).toBeTruthy()
  expect(dialog.queryAllByRole('tab')).toHaveLength(0)
  for (const doc of [TERMOS, PRIVACIDADE]) {
    expect(dialog.getByRole('heading', { name: doc.titulo })).toBeTruthy()
    doc.secoes.forEach((s, i) => {
      expect(dialog.getByRole('heading', { name: `${i + 1} ${s.titulo}` })).toBeTruthy()
    })
  }
})

it('envia sem decidir pelas opções e liga a coleta só se o navegador não escolheu', async () => {
  fireEvent.change(campo('cadastro-razao'), { target: { value: 'Oficina Teste' } })
  fireEvent.change(campo('cadastro-cnpj'), { target: { value: '11222333000181' } })
  fireEvent.change(campo('cadastro-email'), { target: { value: 'a@b.com' } })
  fireEvent.change(campo('cadastro-senha'), { target: { value: 'demo123' } })
  await aceitar()
  fireEvent.click(campo('cadastro-submit'))
  await waitFor(() => expect(acceptIfUndecided).toHaveBeenCalledTimes(1))
  const body = signup.mock.calls[0][0]
  expect(body).toMatchObject({ aceitaTermos: true, aceitaPrivacidade: true })
  expect(body).not.toHaveProperty('contatoProativo')
  expect(body).not.toHaveProperty('cookiesComportamentais')
})
