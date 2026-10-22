/** Contato do dono do catálogo (mock) — CTA WhatsApp. */
export const CATALOGO_WHATSAPP = {
  telefone: '5547999990000',
  displayName: 'Catálogo Inteligente',
}

export function whatsappUrl(mensagem: string): string {
  return `https://wa.me/${CATALOGO_WHATSAPP.telefone}?text=${encodeURIComponent(mensagem)}`
}
