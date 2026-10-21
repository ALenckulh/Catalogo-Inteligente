'use client'

import { Form as AntForm } from 'antd'
import type { FormProps, FormItemProps, FormInstance } from 'antd'

export type { FormProps, FormItemProps, FormInstance }

export const Form = AntForm
export const FormItem = AntForm.Item
export const useForm = AntForm.useForm
export const useWatch = AntForm.useWatch
export const useFormInstance = AntForm.useFormInstance
