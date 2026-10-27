'use client'

import React from 'react'
import { Alert as AntAlert } from 'antd'
import type { AlertProps as AntAlertProps } from 'antd'

export type AlertProps = Omit<AntAlertProps, 'message'> & {
  /** @deprecated Prefer `title` (antd 6). Mapped to `title`. */
  message?: React.ReactNode
}

/** Wrapper: antd 6 usa `title`; aceita `message` legado sem warning. */
export function Alert({ message, title, ...rest }: AlertProps) {
  return <AntAlert title={title ?? message} {...rest} />
}
