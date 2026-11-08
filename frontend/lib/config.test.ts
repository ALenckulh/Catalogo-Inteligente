import { describe, expect, it } from 'vitest'
import { CATALOGO_WHATSAPP, whatsappUrl } from '@/lib/config'

describe('config', () => {
  it('whatsappUrl encodes message', () => {
    const url = whatsappUrl('olá produto')
    expect(url).toContain(CATALOGO_WHATSAPP.telefone)
    expect(url).toContain(encodeURIComponent('olá produto'))
  })
})
