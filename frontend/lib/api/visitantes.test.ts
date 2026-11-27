import { AxiosError, type AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { SESSAO_ATIVA_EM_KEY, SESSAO_ID_KEY, VISITANTE_COOKIE_KEY, VISITANTE_DESDE_KEY } from './config'
import { encerrarSessao, esquecerVisitante } from './visitanteId'
import { SESSAO_INATIVIDADE_MS, dispositivo, garantirSessao, reabrirSessao } from './visitantes'

vi.mock('./config', async (original) => ({ ...(await original<object>()), USE_MOCK: false }))

const post = vi.spyOn(apiClient, 'post')
const abre = (sessaoId: number, cookieId = 'cookie-1') => ({ data: { cookieId, sessaoId } })
const erro = (status?: number) =>
  new AxiosError('falha', undefined, undefined, undefined, status ? ({ status } as AxiosResponse) : undefined)

function salvar(sessaoId: number, idadeMs?: number) {
  localStorage.setItem(VISITANTE_COOKIE_KEY, 'cookie-1')
  localStorage.setItem(VISITANTE_DESDE_KEY, String(Date.now()))
  localStorage.setItem(SESSAO_ID_KEY, String(sessaoId))
  if (idadeMs !== undefined) localStorage.setItem(SESSAO_ATIVA_EM_KEY, String(Date.now() - idadeMs))
}

beforeEach(() => {
  localStorage.clear()
  // Chamada não prevista falha aqui, sem chegar a um backend que esteja no ar.
  post.mockReset().mockRejectedValue(new Error('chamada não prevista'))
})
afterEach(() => vi.useRealTimers())

describe('garantirSessao', () => {
  it('sem sessão salva, abre uma e guarda', async () => {
    post.mockResolvedValueOnce(abre(1))
    expect(await garantirSessao()).toBe(1)
    expect(localStorage.getItem(VISITANTE_COOKIE_KEY)).toBe('cookie-1')
    // Segunda chamada, como depois de recarregar a página: nenhuma requisição.
    expect(await garantirSessao()).toBe(1)
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('reaproveita a que teve evento há menos de 30 min e renova a marca', async () => {
    vi.useFakeTimers()
    salvar(7, SESSAO_INATIVIDADE_MS - 1000)
    expect(await garantirSessao()).toBe(7)
    vi.advanceTimersByTime(SESSAO_INATIVIDADE_MS - 1000)
    expect(await garantirSessao()).toBe(7)
    expect(post).not.toHaveBeenCalled()
  })

  it('depois de 30 min sem evento, abre outra com o mesmo visitante', async () => {
    salvar(7, SESSAO_INATIVIDADE_MS)
    post.mockResolvedValueOnce(abre(8))
    expect(await garantirSessao()).toBe(8)
    expect(post.mock.calls[0][1]).toMatchObject({ cookieId: 'cookie-1' })
  })

  it('id salvo sem marca de atividade (versão anterior) abre outra', async () => {
    salvar(7)
    post.mockResolvedValueOnce(abre(8))
    expect(await garantirSessao()).toBe(8)
  })

  it('depois do logout, abre outra sem informar o visitante de quem saiu', async () => {
    salvar(7, 0)
    esquecerVisitante()
    post.mockResolvedValueOnce(abre(8, 'cookie-2'))
    expect(await garantirSessao()).toBe(8)
    expect((post.mock.calls[0][1] as { cookieId?: string }).cookieId).toBeUndefined()
    expect(localStorage.getItem(VISITANTE_COOKIE_KEY)).toBe('cookie-2')
  })

  it('sessão de usuário logado (sem cookieId na resposta) não mexe no visitante', async () => {
    post.mockResolvedValueOnce({ data: { cookieId: null, sessaoId: 9 } })
    expect(await garantirSessao()).toBe(9)
    expect(localStorage.getItem(VISITANTE_COOKIE_KEY)).toBeNull()
  })

  it('depois de encerrada, abre outra com o mesmo visitante', async () => {
    salvar(7, 0)
    encerrarSessao()
    post.mockResolvedValueOnce(abre(8))
    expect(await garantirSessao()).toBe(8)
    expect(post.mock.calls[0][1]).toMatchObject({ cookieId: 'cookie-1' })
  })

  it('chamadas simultâneas fazem um POST só, e a próxima pode abrir de novo', async () => {
    post.mockResolvedValueOnce(abre(1)).mockResolvedValueOnce(abre(2))
    expect(await Promise.all([garantirSessao(), garantirSessao(), reabrirSessao()])).toEqual([1, 1, 1])
    expect(post).toHaveBeenCalledTimes(1)
    expect(await reabrirSessao()).toBe(2)
  })
})

describe('dispositivo', () => {
  const casos: [string, string, number][] = [
    ['desktop', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/157.0 Safari/537.36', 0],
    ['desktop', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 0],
    ['tablet', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 5],
    ['tablet', 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/157.0 Safari/537.36', 5],
    ['mobile', 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 Chrome/157.0 Mobile Safari/537.36', 5],
    ['mobile', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', 5],
  ]
  it.each(casos)('%s: %s (toque %i)', (esperado, userAgent, maxTouchPoints) => {
    vi.stubGlobal('navigator', { userAgent, maxTouchPoints })
    expect(dispositivo()).toBe(esperado)
    vi.unstubAllGlobals()
  })
})

describe('visitante quando abrir a sessão falha', () => {
  it('400 (cookie desconhecido) cria outro visitante', async () => {
    salvar(7, SESSAO_INATIVIDADE_MS)
    post.mockRejectedValueOnce(erro(400)).mockResolvedValueOnce(abre(8, 'cookie-2'))
    expect(await garantirSessao()).toBe(8)
    expect(localStorage.getItem(VISITANTE_COOKIE_KEY)).toBe('cookie-2')
  })

  it.each([[500], [429], [undefined]])('status %s mantém o visitante e permite nova tentativa', async (status) => {
    salvar(7, SESSAO_INATIVIDADE_MS)
    post.mockRejectedValueOnce(erro(status))
    await expect(garantirSessao()).rejects.toThrow()
    expect(post).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(VISITANTE_COOKIE_KEY)).toBe('cookie-1')

    post.mockResolvedValueOnce(abre(8))
    expect(await garantirSessao()).toBe(8)
  })
})
