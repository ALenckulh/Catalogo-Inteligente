'use client'

import React from 'react'
import { Card as AntCard } from 'antd'
import type { CardProps as AntCardProps } from 'antd'

export type CardShadow = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends AntCardProps {
  shadow?: CardShadow
  borderColor?: string
}

const shadowMap: Record<CardShadow, string | undefined> = {
  none: undefined,
  sm: 'var(--shadow-drop-neutral-sm)',
  md: 'var(--shadow-drop-neutral-md)',
  lg: 'var(--shadow-drop-neutral-lg)',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ shadow, borderColor, style, ...rest }, ref) => {
    const extraStyle: React.CSSProperties = {}
    if (shadow) extraStyle.boxShadow = shadowMap[shadow]
    if (borderColor) extraStyle.borderColor = borderColor
    return (
      <AntCard
        ref={ref}
        style={{ ...extraStyle, ...style }}
        suppressHydrationWarning
        {...rest}
      />
    )
  },
)

Card.displayName = 'Card'
