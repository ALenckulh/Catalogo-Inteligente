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

export { Select, PageableSelect, usePageableSelect } from './Select'
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
  Table,
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
  Table,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  TreeSelect,
  Typography,
  message,
  notification,
}

export type { TableProps } from 'antd'
