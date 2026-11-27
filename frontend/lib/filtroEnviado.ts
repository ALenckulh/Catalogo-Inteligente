/** Último filtro do catálogo enviado como evento, nesta aba. */
const KEY = 'ci_filtro_enviado'

export interface FiltroCatalogo {
  categoria: number | null
  q: string | null
  precoMin: number | null
  precoMax: number | null
}

const VAZIO: FiltroCatalogo = { categoria: null, q: null, precoMin: null, precoMax: null }

function ler(): FiltroCatalogo {
  try {
    return { ...VAZIO, ...(JSON.parse(window.sessionStorage.getItem(KEY) ?? '{}') as Partial<FiltroCatalogo>) }
  } catch {
    return VAZIO
  }
}

/**
 * Registra o filtro atual e diz o que há de novo: voltar ou recarregar não é filtrar de novo, e mudar
 * preço ou texto com a categoria já filtrada não soma outra vez na nota da categoria.
 */
export function registrarFiltro(atual: FiltroCatalogo): { enviar: boolean; categoriaMudou: boolean } {
  const anterior = ler()
  const categoriaMudou = atual.categoria !== anterior.categoria
  const mudou =
    categoriaMudou ||
    atual.q !== anterior.q ||
    atual.precoMin !== anterior.precoMin ||
    atual.precoMax !== anterior.precoMax
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(atual))
  } catch {
    /* ignore */
  }
  const temFiltro = Object.values(atual).some((v) => v !== null)
  return { enviar: mudou && temFiltro, categoriaMudou }
}
