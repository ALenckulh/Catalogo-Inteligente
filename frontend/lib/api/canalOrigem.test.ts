import { expect, it } from 'vitest'
import { canalDe } from './canalOrigem'

const SITE = 'https://renova.com.br/produtos'

it.each([
  [SITE, '', 'direct'],
  [SITE, 'https://renova.com.br/', 'direct'],
  [SITE, 'lixo', 'direct'],
  [SITE, 'https://www.google.com/search?q=motor', 'organic'],
  [SITE, 'https://www.google.com.br/', 'organic'],
  [SITE, 'https://duckduckgo.com/', 'organic'],
  [SITE, 'https://br.search.yahoo.com/', 'organic'],
  [SITE, 'https://instagram.com/renova', 'referral'],
  [SITE, 'https://naogoogle.com/', 'referral'],
  [`${SITE}?utm_campaign=natal+2026`, 'https://www.google.com/', 'campaign:natal 2026'],
  [`${SITE}?utm_campaign=%20`, 'https://instagram.com/', 'referral'],
])('%s vindo de "%s" → %s', (url, referrer, canal) => {
  expect(canalDe(url, referrer)).toBe(canal)
})

it('cabe na coluna (100)', () => {
  expect(canalDe(`${SITE}?utm_campaign=${'x'.repeat(300)}`, '')).toHaveLength(100)
})
