import { onlyDigits } from '@/lib/formatters'

function cpfDigit(digits: string, length: number, weightStart: number): number {
  let sum = 0
  for (let i = 0; i < length; i++) {
    sum += Number(digits.charAt(i)) * (weightStart - i)
  }
  const mod = sum % 11
  return mod < 2 ? 0 : 11 - mod
}

function cnpjDigit(digits: string, weights: number[]): number {
  let sum = 0
  for (let i = 0; i < weights.length; i++) {
    sum += Number(digits.charAt(i)) * weights[i]
  }
  const mod = sum % 11
  return mod < 2 ? 0 : 11 - mod
}

export function isValidCpf(value: string | null | undefined): boolean {
  const digits = onlyDigits(value ?? '')
  if (digits.length !== 11 || new Set(digits).size === 1) return false
  const d1 = cpfDigit(digits, 9, 10)
  const d2 = cpfDigit(digits, 10, 11)
  return Number(digits.charAt(9)) === d1 && Number(digits.charAt(10)) === d2
}

export function isValidCnpj(value: string | null | undefined): boolean {
  const digits = onlyDigits(value ?? '')
  if (digits.length !== 14 || new Set(digits).size === 1) return false
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d1 = cnpjDigit(digits, w1)
  const d2 = cnpjDigit(digits, w2)
  return Number(digits.charAt(12)) === d1 && Number(digits.charAt(13)) === d2
}

/**
 * Digits only. Accepts 10–11 (BR) or 12–13 with country code 55.
 * Empty / blank → null (optional field).
 */
export function normalizeTelefone(value: string | null | undefined): string | null {
  const digits = onlyDigits(value ?? '')
  if (!digits) return null
  if (digits.length === 10 || digits.length === 11) return digits
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return digits
  return null
}

export function isValidTelefone(value: string | null | undefined): boolean {
  if (value == null || String(value).trim() === '') return true
  return normalizeTelefone(value) !== null
}

/** National 10–11 digits for display mask (strip leading 55 if present). */
export function telefoneForMask(value: string | null | undefined): string {
  const digits = onlyDigits(value ?? '')
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits.slice(2)
  }
  return digits
}

export function isValidIdade(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true
  const n = Number(value)
  return Number.isInteger(n) && n >= 18 && n <= 120
}
