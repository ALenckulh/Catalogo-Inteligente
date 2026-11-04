'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
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

/**
 * Sólido só no CTA (`color="primary"`); o resto nasce `outlined` (normas §1.2).
 * `href` interno renderiza `<a>` real e navega pelo router, sem recarregar a página.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant, color = variant === 'link' ? 'primary' : 'default', width, tooltip, style, children, href, onClick, ...rest },
    ref,
  ) => {
    const router = useRouter()

    function navigate(e: React.MouseEvent<HTMLElement>) {
      onClick?.(e as React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>)
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      router.push(href!)
    }

    const btn = (
      <AntButton
        ref={ref}
        variant={variant ?? (color === 'primary' ? 'solid' : 'outlined')}
        color={color}
        style={width !== undefined ? { width, ...style } : style}
        href={href}
        onClick={href?.startsWith('/') && !rest.target ? navigate : onClick}
        {...rest}
      >
        {children}
      </AntButton>
    )
    return tooltip ? <Tooltip title={tooltip}>{btn}</Tooltip> : btn
  },
)

Button.displayName = 'Button'
