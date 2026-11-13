'use client'

import React from 'react'
import { Image as AntImage } from 'antd'
import type { ImageProps as AntImageProps } from 'antd'

export type ImageProps = Omit<AntImageProps, 'alt'> & {
  /** Obrigatório (a11y). Use `""` só quando a imagem for decorativa. */
  alt: string
}

/** Wrapper do antd Image com `alt` obrigatório; `Image.PreviewGroup` agrupa o lightbox. */
function ImageBase(props: ImageProps) {
  return <AntImage {...props} />
}

export const Image = Object.assign(ImageBase, { PreviewGroup: AntImage.PreviewGroup })
