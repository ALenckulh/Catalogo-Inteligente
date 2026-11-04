/** true → lib/mocks; false → live Spring API (`NEXT_PUBLIC_USE_MOCK`). */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'

export const AUTH_TOKEN_KEY = 'ci_auth_token'
export const VISITANTE_COOKIE_KEY = 'ci_visitante_id'
export const SESSAO_ID_KEY = 'ci_sessao_id'
