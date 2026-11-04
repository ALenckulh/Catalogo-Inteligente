'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { App, ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { antdTheme } from '@/lib/theme/antdTheme'
import { CurrentUserProvider } from '@/lib/contexts/CurrentUser/CurrentUserProvider'
import { CookieConsentProvider } from '@/lib/contexts/CookieConsent/CookieConsentProvider'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { MigrarHistoricoGate } from '@/components/auth/MigrarHistoricoGate'
import { SyncBehavioralConsent } from '@/components/auth/SyncBehavioralConsent'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={antdTheme} locale={ptBR}>
        {/* component={false}: sem <div> extra, o CookieBanner segue filho direto do body */}
        <App component={false}>
          <CurrentUserProvider>
            <CookieConsentProvider>
              {children}
              <CookieBanner />
              <SyncBehavioralConsent />
              <MigrarHistoricoGate />
            </CookieConsentProvider>
          </CurrentUserProvider>
        </App>
      </ConfigProvider>
    </AntdRegistry>
  )
}
