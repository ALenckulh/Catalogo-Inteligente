import type { Produto } from '@/lib/types'

export interface FichaPar {
  chave?: string
  valor?: string
}

export function fichaToPairs(ficha: Produto['fichaTecnica'] | undefined): FichaPar[] {
  if (!ficha) return []
  return Object.entries(ficha).map(([chave, valor]) => ({ chave, valor: String(valor) }))
}

/** Sempre um objeto: {} limpa a ficha no PATCH; undefined seria "não alterar". */
export function pairsToFicha(pairs: FichaPar[] | undefined): Record<string, string> {
  const ficha: Record<string, string> = {}
  for (const { chave, valor } of pairs ?? []) {
    const c = chave?.trim()
    const v = valor?.trim()
    if (c && v) ficha[c] = v
  }
  return ficha
}

/** A chave desta linha já apareceu em outra? Sem diferenciar maiúsculas: só a última seria gravada. */
export function chaveRepetida(pairs: FichaPar[] | undefined, chave: string | undefined): boolean {
  const alvo = chave?.trim().toLowerCase()
  return !!alvo && (pairs ?? []).filter((p) => p?.chave?.trim().toLowerCase() === alvo).length > 1
}
