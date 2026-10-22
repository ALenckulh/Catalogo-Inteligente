'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { antdTheme } from '@/lib/theme/antdTheme'
import { CurrentUserProvider } from '@/lib/contexts/CurrentUser/CurrentUserProvider'
import { CookieConsentProvider } from '@/lib/contexts/CookieConsent/CookieConsentProvider'
import { CookieBanner } from '@/components/layout/CookieBanner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={antdTheme} locale={ptBR}>
        <CurrentUserProvider>
          <CookieConsentProvider>
            {children}
            <CookieBanner />
          </CookieConsentProvider>
        </CurrentUserProvider>
      </ConfigProvider>
    </AntdRegistry>
  )
}
