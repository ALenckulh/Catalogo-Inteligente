const BUSCADORES = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex)\./

/** `campaign:<nome>` (utm_campaign), `organic` (buscador), `referral` (outro site) ou `direct`. */
export function canalDe(url: string, referrer: string): string {
  const { hostname, searchParams } = new URL(url)
  const campanha = searchParams.get('utm_campaign')?.trim()
  if (campanha) return `campaign:${campanha}`.slice(0, 100)
  try {
    const origem = new URL(referrer).hostname
    if (origem === hostname) return 'direct'
    return BUSCADORES.test(origem) ? 'organic' : 'referral'
  } catch {
    return 'direct'
  }
}

/**
 * Canal da chegada, lido uma vez quando a aplicação carrega: a navegação interna troca a URL e perderia a
 * campanha. Fica só em memória, porque a pessoa pode ainda não ter aceitado os cookies; vai para o banco na
 * abertura da sessão, que exige o aceite.
 */
export const CANAL_DA_CHEGADA =
  typeof window === 'undefined' ? 'direct' : canalDe(window.location.href, document.referrer)
