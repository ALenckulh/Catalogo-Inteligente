/** Contato da Renova Retífica — CTA WhatsApp. */
export const CATALOGO_WHATSAPP = {
  telefone: '5547920026438',
  displayName: 'Renova Retífica de Motores',
}

export function whatsappUrl(mensagem: string): string {
  return `https://wa.me/${CATALOGO_WHATSAPP.telefone}?text=${encodeURIComponent(mensagem)}`
}
