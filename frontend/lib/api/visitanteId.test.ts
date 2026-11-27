import { beforeEach, describe, expect, it } from 'vitest'
import { SESSAO_ATIVA_EM_KEY, SESSAO_ID_KEY, VISITANTE_COOKIE_KEY, VISITANTE_DESDE_KEY } from './config'
import { VISITANTE_VALIDADE_MS, encerrarSessao, esquecerVisitante, persistVisitanteId, readVisitanteId } from './visitanteId'

const CHAVES = [VISITANTE_COOKIE_KEY, VISITANTE_DESDE_KEY, SESSAO_ID_KEY, SESSAO_ATIVA_EM_KEY]
const restantes = () => CHAVES.filter((c) => localStorage.getItem(c) !== null)

function salvar(idadeMs: number) {
  localStorage.setItem(VISITANTE_COOKIE_KEY, 'v1')
  localStorage.setItem(VISITANTE_DESDE_KEY, String(Date.now() - idadeMs))
  localStorage.setItem(SESSAO_ID_KEY, '7')
  localStorage.setItem(SESSAO_ATIVA_EM_KEY, String(Date.now()))
}

beforeEach(() => localStorage.clear())

describe('visitante anônimo (RF18: 30 dias)', () => {
  it('vale até 30 dias da criação', () => {
    salvar(VISITANTE_VALIDADE_MS - 1000)
    expect(readVisitanteId()).toBe('v1')
  })

  it('vencido: é apagado, junto com a sessão', () => {
    salvar(VISITANTE_VALIDADE_MS)
    expect(readVisitanteId()).toBeNull()
    expect(restantes()).toEqual([])
  })

  it('sem data de criação (versão anterior): é apagado', () => {
    salvar(0)
    localStorage.removeItem(VISITANTE_DESDE_KEY)
    expect(readVisitanteId()).toBeNull()
    expect(restantes()).toEqual([])
  })

  it('reabrir sessão do mesmo visitante não renova os 30 dias; outro visitante recomeça', () => {
    salvar(VISITANTE_VALIDADE_MS - 1000)
    const desde = localStorage.getItem(VISITANTE_DESDE_KEY)
    persistVisitanteId('v1')
    expect(localStorage.getItem(VISITANTE_DESDE_KEY)).toBe(desde)

    persistVisitanteId('v2')
    expect(readVisitanteId()).toBe('v2')
    expect(Number(localStorage.getItem(VISITANTE_DESDE_KEY))).toBeGreaterThan(Number(desde))
  })
})

it('encerrarSessao mantém o visitante; esquecerVisitante apaga tudo', () => {
  salvar(0)
  encerrarSessao()
  expect(restantes()).toEqual([VISITANTE_COOKIE_KEY, VISITANTE_DESDE_KEY])
  salvar(0)
  esquecerVisitante()
  expect(restantes()).toEqual([])
})
