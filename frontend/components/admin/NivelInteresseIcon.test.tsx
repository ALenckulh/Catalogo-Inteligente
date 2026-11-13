import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NivelInteresseIcon } from '@/components/admin/NivelInteresseIcon'
import { NIVEIS_INTERESSE, type NivelInteresse } from '@/lib/nivelInteresse'

describe('NivelInteresseIcon', () => {
  it.each(Object.keys(NIVEIS_INTERESSE) as NivelInteresse[])('descreve o nível %s', (nivel) => {
    const n = NIVEIS_INTERESSE[nivel]
    render(<NivelInteresseIcon nivel={nivel} />)
    expect(screen.getByLabelText(`Nível de interesse: ${n.label} · ${n.descricao}`)).toBeInTheDocument()
  })
})
