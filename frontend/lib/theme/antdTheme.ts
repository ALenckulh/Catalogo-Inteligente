import type { ThemeConfig } from 'antd'
import { palette, text, surface, border, typography, radius } from './tokens'

export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: palette.primary[400],
    // Status: texto escuro o bastante p/ AA em Tag/Alert soft (bg pinado abaixo)
    colorSuccess: palette.success[700],
    colorWarning: palette.warning[700],
    colorError:   palette.error[600],
    colorInfo:    palette.primary[500],

    // Soft primary/info — Menu/Select ativo, Button filled, Alert info, Tag processing
    colorPrimaryBg:      palette.primary[50],
    colorPrimaryBgHover: palette.primary[100],
    colorPrimaryBorder:  palette.primary[200],
    colorInfoBg:         palette.primary[50],
    colorInfoBgHover:    palette.primary[100],
    colorInfoBorder:     palette.primary[200],

    colorSuccessBg:      palette.success[50],
    colorSuccessBgHover: palette.success[100],
    colorSuccessBorder:  palette.success[200],
    colorWarningBg:      palette.warning[50],
    colorWarningBgHover: palette.warning[100],
    colorWarningBorder:  palette.warning[200],
    colorErrorBg:        palette.error[50],
    colorErrorBgHover:   palette.error[100],
    colorErrorBorder:    palette.error[200],

    colorText:          text.neutralStrong,
    colorTextSecondary: text.neutralDefault,
    colorTextTertiary:  text.neutralSubtle,
    colorTextDisabled:  palette.neutral[400],

    colorBgBase:      surface.base,
    colorBgContainer: surface.base,
    colorBgElevated:  surface.base,
    colorBgLayout:    surface.neutralSubtle,
    colorBgMask:      'rgba(10, 10, 10, 0.45)',
    // solid default = secondary (~4.9:1 com branco)
    colorBgSolid:       palette.secondary[400],
    colorBgSolidHover:  palette.secondary[500],
    colorBgSolidActive: palette.secondary[600],

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
