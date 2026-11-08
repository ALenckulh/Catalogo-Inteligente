import { describe, expect, it } from 'vitest'
import {
  formatCnpj,
  formatCpf,
  formatDate,
  formatDateTime,
  formatTelefone,
  onlyDigits,
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
