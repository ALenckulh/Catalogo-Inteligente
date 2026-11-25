/**
 * Último valor de cookies comportamentais confirmado pelo backend para cada usuário, neste navegador.
 * O consentimento é append-only: sem essa marca, cada login (ou cada troca em /conta) gravava
 * uma linha nova igual à anterior.
 *
 * A marca só vai para o localStorage depois do sucesso: se a aba fechar no meio da chamada, a
 * próxima visita envia de novo. Durante a chamada vale `emAndamento`, só em memória.
 */
const KEY = 'ci_consent_synced'

let emAndamento: string | null = null

function chave(usuarioId: number, aceito: boolean) {
  return `${usuarioId}:${aceito}`
}

/** Já confirmado, ou sendo enviado agora por outro componente. */
export function isConsentSynced(usuarioId: number, aceito: boolean): boolean {
  const k = chave(usuarioId, aceito)
  if (emAndamento !== null) return emAndamento === k
  try {
    return window.localStorage.getItem(KEY) === k
  } catch {
    return false
  }
}

/** Executa o envio e marca como sincronizado só se ele der certo. Repassa o erro de `enviar`. */
export async function syncConsent(
  usuarioId: number,
  aceito: boolean,
  enviar: () => Promise<unknown>,
): Promise<void> {
  const k = chave(usuarioId, aceito)
  emAndamento = k
  try {
    await enviar()
    try {
      window.localStorage.setItem(KEY, k)
    } catch {
      /* ignore */
    }
  } finally {
    // Uma troca mais nova pode ter assumido o lugar desta.
    if (emAndamento === k) emAndamento = null
  }
}
