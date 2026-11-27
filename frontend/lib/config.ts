import { normalizeTelefone } from './validators'

/** Versão vigente dos Termos e da Política; espelha ConsentimentoLgpd.VERSAO_TERMOS do backend. */
export const VERSAO_TERMOS = '1.0'

/** Contato público da loja (Sobre, Ajuda e documentos legais). */
export const EMPRESA = {
  nome: 'Renova Retífica de Motores',
  endereco: 'R. Manoel Francisco da Costa, 443, Jaraguá do Sul, SC',
  telefone: '(47) 3370-2206',
  telefoneHref: 'tel:+554733702206',
  email: 'financeiro@retificarenova.com.br',
  horario: { dias: 'Segunda a sexta', horas: '7:45 às 12:00 · 13:15 às 17:45' },
} as const

/** Contato da Renova Retífica — CTA WhatsApp. */
export const CATALOGO_WHATSAPP = {
  telefone: '5547920026438',
  displayName: EMPRESA.nome,
}

/** Cliente fala com a loja. */
export function whatsappUrl(mensagem: string): string {
  return `https://wa.me/${CATALOGO_WHATSAPP.telefone}?text=${encodeURIComponent(mensagem)}`
}

/** Loja fala com o cliente. null se o telefone não serve. Sem DDI, assume o Brasil (55). */
export function whatsappClienteUrl(telefone: string | null | undefined, mensagem: string): string | null {
  const numero = normalizeTelefone(telefone)
  if (!numero) return null
  const ddi = numero.length <= 11 ? '55' : ''
  return `https://wa.me/${ddi}${numero}?text=${encodeURIComponent(mensagem)}`
}
