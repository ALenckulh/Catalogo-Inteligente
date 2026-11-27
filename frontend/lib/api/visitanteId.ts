import { SESSAO_ATIVA_EM_KEY, SESSAO_ID_KEY, VISITANTE_COOKIE_KEY, VISITANTE_DESDE_KEY } from './config'

/** RF18: o identificador do visitante anônimo persiste por 30 dias, contados da criação. */
export const VISITANTE_VALIDADE_MS = 30 * 24 * 60 * 60 * 1000

function remover(...chaves: string[]): void {
  if (typeof window === 'undefined') return
  try {
    for (const chave of chaves) window.localStorage.removeItem(chave)
  } catch {
    /* ignore */
  }
}

/** Id do visitante anônimo deste navegador. Vencido, ou sem data de criação, é apagado. */
export function readVisitanteId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const id = window.localStorage.getItem(VISITANTE_COOKIE_KEY)
    if (!id) return null
    const desde = Number(window.localStorage.getItem(VISITANTE_DESDE_KEY) ?? Number.NaN)
    if (Date.now() - desde < VISITANTE_VALIDADE_MS) return id
  } catch {
    return null
  }
  esquecerVisitante()
  return null
}

/** A data só é gravada quando o id muda: reaproveitar o visitante não renova os 30 dias. */
export function persistVisitanteId(id: string): void {
  if (readVisitanteId() === id) return
  try {
    window.localStorage.setItem(VISITANTE_COOKIE_KEY, id)
    window.localStorage.setItem(VISITANTE_DESDE_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}

/** O próximo evento abre outra sessão (o visitante, se houver, continua). */
export function encerrarSessao(): void {
  remover(SESSAO_ID_KEY, SESSAO_ATIVA_EM_KEY)
}

/**
 * Ao sair da conta: quem usar o navegador depois não herda o visitante nem a sessão de quem saiu
 * (eles podem já estar ligados à conta pela migração de histórico).
 */
export function esquecerVisitante(): void {
  encerrarSessao()
  remover(VISITANTE_COOKIE_KEY, VISITANTE_DESDE_KEY)
}
