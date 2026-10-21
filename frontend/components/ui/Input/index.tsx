'use client'

import React from 'react'
import { Input as AntInput } from 'antd'
import type {
  InputProps as AntInputProps,
  InputRef,
  PasswordProps,
  TextAreaProps,
  SearchProps,
} from 'antd/es/input'

export type { InputRef, PasswordProps, TextAreaProps, SearchProps }
export type InputProps = AntInputProps

const InputBase = React.forwardRef<InputRef, InputProps>((props, ref) => (
  <AntInput ref={ref} {...props} />
))
InputBase.displayName = 'Input'

const Password = React.forwardRef<InputRef, PasswordProps>((props, ref) => (
  <AntInput.Password ref={ref} {...props} />
))
Password.displayName = 'Input.Password'

const TextArea = React.forwardRef<
  React.ComponentRef<typeof AntInput.TextArea>,
  TextAreaProps
>((props, ref) => <AntInput.TextArea ref={ref} {...props} />)
TextArea.displayName = 'Input.TextArea'

const Search = React.forwardRef<InputRef, SearchProps>((props, ref) => (
  <AntInput.Search ref={ref} {...props} />
))
Search.displayName = 'Input.Search'

export const Input = Object.assign(InputBase, { Password, TextArea, Search })
