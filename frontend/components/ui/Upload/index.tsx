'use client'

import React from 'react'
import { Upload as AntUpload } from 'antd'
import type { UploadProps as AntUploadProps } from 'antd'

export type UploadProps = AntUploadProps

/** Wrapper do antd Upload; `showUploadList` desligado por padrão (a tela mostra o próprio preview). */
export function Upload({ showUploadList = false, ...rest }: UploadProps) {
  return <AntUpload showUploadList={showUploadList} {...rest} />
}
