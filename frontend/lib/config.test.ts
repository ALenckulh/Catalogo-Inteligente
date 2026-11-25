import { describe, expect, it } from 'vitest'
import { CATALOGO_WHATSAPP, whatsappClienteUrl, whatsappUrl } from '@/lib/config'

describe('config', () => {
  it('whatsappUrl encodes message', () => {
    const url = whatsappUrl('olá produto')
    expect(url).toContain(CATALOGO_WHATSAPP.telefone)
    expect(url).toContain(encodeURIComponent('olá produto'))
  })

  it.each([
    ['47988123402', '5547988123402'],
    ['(47) 98812-3402', '5547988123402'],
    ['4733712345', '554733712345'],
    ['5547988123402', '5547988123402'],
  ])('whatsappClienteUrl usa o telefone do cliente: %s', (telefone, numero) => {
    expect(whatsappClienteUrl(telefone, 'Olá Ana!')).toBe(`https://wa.me/${numero}?text=${encodeURIComponent('Olá Ana!')}`)
  })

  it.each([null, undefined, '', 'abc', '123'])('whatsappClienteUrl sem telefone válido: %s', (telefone) => {
    expect(whatsappClienteUrl(telefone, 'x')).toBeNull()
  })
})
