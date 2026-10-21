'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { antdTheme } from '@/lib/theme/antdTheme'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={antdTheme} locale={ptBR}>
        {children}
      </ConfigProvider>
    </AntdRegistry>
  )
}
