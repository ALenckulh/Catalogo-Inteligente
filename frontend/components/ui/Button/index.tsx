'use client'

import React from 'react'
import { Button as AntButton, Tooltip } from 'antd'
import type { ButtonProps as AntButtonProps } from 'antd'

export type ButtonVariant = 'solid' | 'outlined' | 'dashed' | 'filled' | 'text' | 'link'
export type ButtonColor = 'default' | 'primary' | 'danger'

export interface ButtonProps extends Omit<AntButtonProps, 'variant' | 'color' | 'danger' | 'type'> {
  variant?: ButtonVariant
  color?: ButtonColor
  width?: number | string
  tooltip?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'solid', color = 'default', width, tooltip, style, children, ...rest }, ref) => {
    const btn = (
      <AntButton
        ref={ref}
        variant={variant}
        color={color}
        style={width !== undefined ? { width, ...style } : style}
        {...rest}
      >
        {children}
      </AntButton>
    )
    return tooltip ? <Tooltip title={tooltip}>{btn}</Tooltip> : btn
  },
)

Button.displayName = 'Button'
