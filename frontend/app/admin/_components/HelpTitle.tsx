'use client'

import type { ReactNode } from 'react'
import { InfoCircleOutlined } from '@ant-design/icons'
import { Space, Tooltip } from '@/components/ui'

/** Rótulo com ícone de ajuda (tooltip com a definição da métrica). */
export function HelpTitle({ label, help }: { label: ReactNode; help: ReactNode }) {
  return (
    <Space size={4}>
      <span>{label}</span>
      <Tooltip title={help} styles={{ root: { maxWidth: 380 } }}>
        <InfoCircleOutlined aria-label={typeof label === 'string' ? `Ajuda: ${label}` : 'Ajuda'} />
      </Tooltip>
    </Space>
  )
}
