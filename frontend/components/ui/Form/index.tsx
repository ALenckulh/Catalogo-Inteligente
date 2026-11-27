'use client'

import React from 'react'
import { Form as AntForm } from 'antd'
import type { FormProps, FormItemProps, FormInstance } from 'antd'

export type { FormProps, FormItemProps, FormInstance }

export const Form = AntForm

/** O rótulo aponta para o `id` do campo: o antd usaria o `name`, e o campo com `id` próprio ficava sem rótulo. */
export function FormItem<Values = unknown>(props: FormItemProps<Values>) {
  const { children } = props
  const id = React.isValidElement<{ id?: string }>(children) ? children.props.id : undefined
  // Só quando há id: `htmlFor={undefined}` apagaria o vínculo que o antd faz pelo `name`.
  return <AntForm.Item<Values> {...(id ? { htmlFor: id } : {})} {...props} />
}

export const useForm = AntForm.useForm
export const useWatch = AntForm.useWatch
export const useFormInstance = AntForm.useFormInstance
