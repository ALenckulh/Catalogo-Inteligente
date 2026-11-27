import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { migrarHistorico } from '@/lib/api/auth'
import { readVisitanteId, persistVisitanteId } from '@/lib/api/visitanteId'
import { useCurrentUser } from '@/lib/contexts/CurrentUser/CurrentUserContext'
import { MigrarHistoricoGate } from './MigrarHistoricoGate'

vi.mock('@/lib/api/config', async (original) => ({ ...(await original<object>()), USE_MOCK: false }))
vi.mock('@/lib/api/auth', () => ({ migrarHistorico: vi.fn() }))
vi.mock('@/lib/contexts/CurrentUser/CurrentUserContext', () => ({ useCurrentUser: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.setItem('ci_migrar_pending', '1')
  persistVisitanteId('v1')
  vi.mocked(migrarHistorico).mockReset().mockResolvedValue()
  vi.mocked(useCurrentUser).mockReturnValue({ isAuthenticated: true, loading: false } as never)
})
afterEach(cleanup)

const pendente = () => window.sessionStorage.getItem('ci_migrar_pending')

it('"Não associar" descarta e esquece o visitante', async () => {
  render(<MigrarHistoricoGate />)
  await userEvent.click(await screen.findByRole('button', { name: 'Não associar' }))
  await waitFor(() => expect(migrarHistorico).toHaveBeenCalledWith(false))
  expect(readVisitanteId()).toBeNull()
  expect(pendente()).toBeNull()
})

it('"Sim, associar" leva o histórico', async () => {
  render(<MigrarHistoricoGate />)
  await userEvent.click(await screen.findByRole('button', { name: 'Sim, associar' }))
  await waitFor(() => expect(migrarHistorico).toHaveBeenCalledWith(true))
  expect(readVisitanteId()).toBe('v1')
})

it('Esc não descarta nada', async () => {
  render(<MigrarHistoricoGate />)
  await screen.findByRole('button', { name: 'Não associar' })
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(pendente()).toBeNull())
  expect(migrarHistorico).not.toHaveBeenCalled()
  expect(readVisitanteId()).toBe('v1')
})

it('falha ao descartar mantém o visitante, para perguntar de novo', async () => {
  vi.mocked(migrarHistorico).mockRejectedValue(new Error('rede'))
  render(<MigrarHistoricoGate />)
  await userEvent.click(await screen.findByRole('button', { name: 'Não associar' }))
  await waitFor(() => expect(pendente()).toBeNull())
  expect(readVisitanteId()).toBe('v1')
})
