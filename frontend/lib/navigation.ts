/** Aceita só caminho interno em `?next=`; qualquer outro valor cai na vitrine. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith('/') && !/^\/[/\]|[\t\r\n]/.test(next) ? next : '/'
}

/** Link para `/entrar` que volta ao caminho atual depois do login. */
export function entrarHref(path: string): string {
  return `/entrar?next=${encodeURIComponent(path)}`
}

/** Como `safeNext`, só para telas do admin; a de login não vale (voltaria para ela mesma). */
export function safeAdminNext(next: string | null | undefined): string {
  const destino = safeNext(next)
  return /^\/admin(?:[/?]|$)/.test(destino) && !destino.startsWith('/admin/entrar') ? destino : '/admin'
}

/** Link para `/admin/entrar` que volta à tela pedida depois do login. */
export function adminEntrarHref(path: string): string {
  return safeAdminNext(path) === '/admin' ? '/admin/entrar' : `/admin/entrar?next=${encodeURIComponent(path)}`
}
