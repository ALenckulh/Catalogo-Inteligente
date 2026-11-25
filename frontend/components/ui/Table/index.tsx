'use client'

import { Table as AntTable } from 'antd'
import type { TableProps } from 'antd'

export type { TableProps } from 'antd'

/**
 * Compacta e com layout fixo: coluna curta declara `width`; a de texto longo fica sem, para receber a largura que
 * sobra (docs/09 §6).
 */
export function Table<T extends object>(props: TableProps<T>) {
  return <AntTable<T> size="small" tableLayout="fixed" {...props} />
}
