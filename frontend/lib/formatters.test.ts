import { describe, expect, it } from 'vitest'
import {
  formatCnpj,
  formatCpf,
  formatDate,
  formatDateTime,
  formatTelefone,
  onlyDigits,
  parsePrecoDigitado,
  precoInputProps,
  toMoney,
  toMoneyBRL,
} from '@/lib/formatters'

describe('formatters', () => {
  it('onlyDigits strips non-digits', () => {
    expect(onlyDigits('a1b2c3')).toBe('123')
  })

  it('toMoney and toMoneyBRL', () => {
    expect(toMoney(null)).toBe('—')
    expect(toMoney(10)).toMatch(/10[,.]00/)
    expect(toMoneyBRL(10)).toMatch(/^R\$ /)
    expect(toMoneyBRL(undefined)).toBe('—')
  })

  it.each([
    ['1234,50', '1234.50'],
    ['1.234,50', '1234.50'],
    ['1.234.567,89', '1234567.89'],
    ['1234.50', '1234.50'],
    ['1.234', '1234'],
    ['R$ 10,5', '10.5'],
    ['0,01', '0.01'],
    ['-5', '-5'],
    ['', ''],
  ])('parsePrecoDigitado %s -> %s', (texto, esperado) => {
    expect(parsePrecoDigitado(texto)).toBe(esperado)
  })

  it('precoInputProps formata em pt-BR e preserva o texto durante a digitação', () => {
    const { formatter } = precoInputProps()
    expect(formatter(1234.5, { userTyping: false, input: '' })).toBe('1.234,50')
    expect(formatter(1234.5, { userTyping: true, input: '1234,5' })).toBe('1234,5')
    expect(formatter('', { userTyping: false, input: '' })).toBe('')
    expect(precoInputProps(0).formatter(1234, { userTyping: false, input: '' })).toBe('1.234')
  })

  it('formatCpf and formatCnpj', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25')
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('formatTelefone', () => {
    expect(formatTelefone('47999998888')).toContain('(47)')
    expect(formatTelefone('4733334444')).toContain('(47)')
  })

  it('formatDate / formatDateTime', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('2026-01-15')).toBe('15/01/2026')
    expect(formatDateTime('2026-01-15T12:30:00')).toContain('15/01/2026')
    expect(formatDate('not-a-date')).toBe('—')
  })
})
