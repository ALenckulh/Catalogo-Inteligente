export { Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonColor } from './Button'

export { Input } from './Input'
export type { InputProps, InputRef, PasswordProps, TextAreaProps, SearchProps } from './Input'

export { Form, FormItem, useForm, useWatch, useFormInstance } from './Form'
export type { FormProps, FormItemProps, FormInstance } from './Form'

export { Card } from './Card'
export type { CardProps, CardShadow } from './Card'

export { Alert } from './Alert'
export type { AlertProps } from './Alert'

export { Image } from './Image'
export type { ImageProps } from './Image'

export { Table } from './Table'
export type { TableProps } from './Table'

export { Upload } from './Upload'
export type { UploadProps } from './Upload'

export { Select, PageableSelect, usePageableSelect, LIMPAR } from './Select'
export type { SelectProps, PageableSelectProps, PageableSelectPage } from './Select'

import {
  App,
  Badge,
  Breadcrumb,
  Checkbox,
  Col,
  Collapse,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Flex,
  InputNumber,
  Layout as AntLayout,
  Menu,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Radio,
  Result,
  Row,
  Segmented,
  Slider,
  Space,
  Spin,
  Statistic,
  Steps,
  Switch,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  TreeSelect,
  Typography,
  message,
  notification,
} from 'antd'

/** Re-export com estáticos (Header/Content/…) — `export { Layout } from 'antd'` quebra no Turbopack. */
export const Layout = AntLayout

export {
  App,
  Badge,
  Breadcrumb,
  Checkbox,
  Col,
  Collapse,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Flex,
  InputNumber,
  Menu,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Radio,
  Result,
  Row,
  Segmented,
  Slider,
  Space,
  Spin,
  Statistic,
  Steps,
  Switch,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  TreeSelect,
  Typography,
  message,
  notification,
}
