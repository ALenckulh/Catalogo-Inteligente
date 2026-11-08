import { describe, expect, it } from 'vitest'
import {
  isValidCnpj,
  isValidCpf,
  isValidIdade,
  isValidTelefone,
  normalizeTelefone,
  telefoneForMask,
} from '@/lib/validators'

describe('validators', () => {
  it('isValidCpf', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('11111111111')).toBe(false)
    expect(isValidCpf('123')).toBe(false)
  })

  it('isValidCnpj', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
    expect(isValidCnpj('00000000000000')).toBe(false)
  })

  it('telefone helpers', () => {
    expect(normalizeTelefone('')).toBeNull()
    expect(normalizeTelefone('47999998888')).toBe('47999998888')
    expect(normalizeTelefone('5547999998888')).toBe('5547999998888')
    expect(normalizeTelefone('123')).toBeNull()
    expect(isValidTelefone('')).toBe(true)
    expect(isValidTelefone('47999998888')).toBe(true)
    expect(isValidTelefone('123')).toBe(false)
    expect(telefoneForMask('5547999998888')).toBe('47999998888')
  })

  it('isValidIdade', () => {
    expect(isValidIdade('')).toBe(true)
    expect(isValidIdade(25)).toBe(true)
    expect(isValidIdade(10)).toBe(false)
    expect(isValidIdade(200)).toBe(false)
  })
})
