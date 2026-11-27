/**
 * Contas que já decidiram sobre cookies comportamentais, neste navegador. Depois da primeira decisão só
 * /conta muda a conta; a escolha de cada navegador vale só nele (na dúvida, o mais restritivo dos dois).
 */
const KEY = 'ci_consent_synced'

/** Só em memória: uma troca em /conta durante o envio inicial não pode ser desfeita por ele. */
const decididas = new Set<number>()

export function contaJaDecidiu(usuarioId: number): boolean {
  if (decididas.has(usuarioId)) return true
  try {
    return window.localStorage.getItem(KEY) === String(usuarioId)
  } catch {
    return false
  }
}

export function marcarContaDecidida(usuarioId: number): void {
  decididas.add(usuarioId)
  try {
    window.localStorage.setItem(KEY, String(usuarioId))
  } catch {
    /* ignore */
  }
}

/** A primeira decisão não chegou à conta: ela continua sem decidir. */
export function desmarcarConta(usuarioId: number): void {
  decididas.delete(usuarioId)
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

let envioInicial: Promise<void> | null = null

/** Primeira decisão a caminho da conta: um evento enviado antes dela levaria 403. */
export function registrarEnvioInicial(envio: Promise<void>): void {
  envioInicial = envio
  void envio.finally(() => {
    if (envioInicial === envio) envioInicial = null
  })
}

export async function aguardarEnvioInicial(): Promise<void> {
  // Um passo depois: o envio é registrado nos efeitos do mesmo render em que o evento dispara.
  await Promise.resolve()
  await envioInicial
}
