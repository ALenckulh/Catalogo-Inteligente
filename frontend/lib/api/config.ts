/**
 * true → lib/mocks; false → live Spring API (`NEXT_PUBLIC_USE_MOCK`).
 * Permite rodar o front sem backend: cada função de lib/api tem o ramo mock e o HTTP real.
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'

export const AUTH_TOKEN_KEY = 'ci_auth_token'
export const AUTH_USER_KEY = 'ci_auth_user'
export const VISITANTE_COOKIE_KEY = 'ci_visitante_id'
/** Momento (ms) em que o visitante foi criado: o id vale 30 dias a partir daí. */
export const VISITANTE_DESDE_KEY = 'ci_visitante_desde'
export const SESSAO_ID_KEY = 'ci_sessao_id'
/** Momento (ms) do último evento da sessão: decide se ela ainda vale. */
export const SESSAO_ATIVA_EM_KEY = 'ci_sessao_ativa_em'

/**
 * `src` de uma imagem de produto. Absoluta (CDN, placeholder, blob/data do mock) passa direto;
 * relativa (`produtos/imagens/{id}`, BLOB no Postgres) é resolvida contra a base da API.
 */
export function imagemSrc(url: string): string {
  return /^(https?:|blob:|data:)/.test(url) ? url : `${API_BASE_URL}/${url}`
}
