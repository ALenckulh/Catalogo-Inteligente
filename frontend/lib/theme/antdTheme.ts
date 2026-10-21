import type { ThemeConfig } from 'antd'
import { palette, text, surface, border, typography, radius } from './tokens'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: palette.primary[400],
    colorSuccess: palette.success[400],
    colorWarning: palette.warning[400],
    colorError:   palette.error[400],
    colorInfo:    palette.primary[400],

    colorText:          text.neutralStrong,
    colorTextSecondary: text.neutralDefault,
    colorTextTertiary:  text.neutralSubtle,
    colorTextDisabled:  palette.neutral[400],

    colorBgBase:      surface.base,
    colorBgContainer: surface.base,
    colorBgElevated:  surface.base,
    colorBgLayout:    surface.neutralSubtle,
    colorBgMask:      'rgba(10, 10, 10, 0.45)',

    colorBorder:          border.neutralDefault,
    colorBorderSecondary: border.neutralSubtle,

    borderRadius:   radius.default,
    borderRadiusSM: radius.sm,
    borderRadiusLG: radius.md,
    borderRadiusXS: 2,

    fontFamily:  typography.fontFamilySans,
    fontSize:    typography.size.lg,
    fontSizeSM:  typography.size.base,
    fontSizeLG:  typography.size.xl,
    fontSizeXL:  typography.size['2xl'],
    fontSizeHeading1: typography.size['4xl'],
    fontSizeHeading2: typography.size['3xl'],
    fontSizeHeading3: typography.size['2xl'],
    fontSizeHeading4: typography.size.xl,
    fontSizeHeading5: typography.size.lg,

    boxShadow:          '0 2px 8px 0 rgba(58, 59, 61, 0.08)',
    boxShadowSecondary: '0 1px 2px 0 rgba(58, 59, 61, 0.07)',
    boxShadowTertiary:  '0 4px 24px 4px rgba(58, 59, 61, 0.05)',
  },
  components: {
    Layout: {
      headerBg: surface.base,
      bodyBg:   surface.neutralSubtle,
      siderBg:  surface.base,
      footerBg: surface.neutralSubtle,
    },
    Button: { controlHeight: 36, fontWeight: 500 },
    Tabs: { cardBg: surface.neutralSubtle },
  },
}
