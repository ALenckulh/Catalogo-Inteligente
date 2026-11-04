/** Aceita só caminho interno em `?next=`; qualquer outro valor cai na vitrine. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith('/') && !/^\/[/\]|[\t\r\n]/.test(next) ? next : '/'
}

/** Link para `/entrar` que volta ao caminho atual depois do login. */
export function entrarHref(path: string): string {
  return `/entrar?next=${encodeURIComponent(path)}`
}
