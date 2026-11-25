import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function toMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function toMoneyBRL(value: number | null | undefined): string {
  const formatted = toMoney(value)
  return formatted === '—' ? '—' : `R$ ${formatted}`
}

/**
 * Texto digitado → número em notação JS ("1.234,50" e "1234.50" → "1234.50").
 * Com vírgula, ponto é milhar; sem vírgula, ponto só é milhar em grupos de 3 ("1.234" → "1234").
 */
export function parsePrecoDigitado(texto: string | undefined): string {
  const t = (texto ?? '').replace(/[^\d.,-]/g, '')
  if (t.includes(',')) return t.replace(/\./g, '').replace(',', '.')
  return /^-?\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t
}

/** Props de InputNumber para preço em pt-BR. Enquanto digita, mantém o texto como está. */
export function precoInputProps(minDecimais: 0 | 2 = 2) {
  return {
    formatter: (
      value: string | number | undefined,
      info: { userTyping: boolean; input: string },
    ): string => {
      if (info.userTyping) return info.input
      if (value === undefined || value === null || value === '') return ''
      return Number(value).toLocaleString('pt-BR', {
        minimumFractionDigits: minDecimais,
        maximumFractionDigits: 2,
      })
    },
    // String, não Number(): vazio viraria 0. O InputNumber converte.
    parser: (texto: string | undefined) => parsePrecoDigitado(texto) as unknown as number,
  }
}

export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function formatTelefone(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim()
  }
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim()
}

export function formatDate(
  value: string | Date | null | undefined,
  pattern = 'DD/MM/YYYY',
): string {
  if (!value) return '—'
  const d = dayjs(value)
  return d.isValid() ? d.format(pattern) : '—'
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return formatDate(value, 'DD/MM/YYYY HH:mm')
}
