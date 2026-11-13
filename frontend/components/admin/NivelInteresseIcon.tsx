'use client'

import { CloudOutlined, FireFilled, FireOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { Tooltip } from '@/components/ui'
import { NIVEIS_INTERESSE, type NivelInteresse } from '@/lib/nivelInteresse'

const ICONES = {
  QUENTE: FireFilled,
  MORNO: FireOutlined,
  FRIO: CloudOutlined,
  SEM_SCORE: MinusCircleOutlined,
} as const

/** Ícone compacto do nível de interesse, com tooltip "Quente (70–100) · Bom momento para contato". */
export function NivelInteresseIcon({ nivel }: { nivel: NivelInteresse }) {
  const Icone = ICONES[nivel]
  const n = NIVEIS_INTERESSE[nivel]
  const texto = `${n.label} · ${n.descricao}`
  return (
    <Tooltip title={texto}>
      <Icone aria-label={`Nível de interesse: ${texto}`} style={{ color: n.cor, fontSize: 16 }} />
    </Tooltip>
  )
}
