import { normalizeTelefone } from './validators'

/** Contato da Renova Retífica — CTA WhatsApp. */
export const CATALOGO_WHATSAPP = {
  telefone: '5547920026438',
  displayName: 'Renova Retífica de Motores',
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
