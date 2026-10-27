/**
 * Espelho em TS dos design tokens. Fonte CSS: app/design-tokens.css.
 * Para uso em style inline, mapping do antd theme ou lógica.
 */

export const palette = {
  primary: {
    50:  '#E8EEF3',
    100: '#D1DDE7',
    200: '#A3BBD0',
    300: '#6E96B3',
    400: '#3D6F94',
    500: '#345F7F',
    600: '#2A4D67',
    700: '#213C50',
    800: '#172C3A',
    900: '#0E1B24',
  },
  secondary: {
    50:  '#E6F3F1',
    100: '#C8E5E1',
    200: '#95CBC4',
    300: '#5AA99F',
    400: '#2F7D74',
    500: '#286B64',
    600: '#215853',
    700: '#1A4642',
    800: '#133431',
    900: '#0C2220',
  },
  success: {
    50:  '#F1FBE8',
    100: '#E3F6CF',
    200: '#C6EC9F',
    300: '#9EDB5A',
    400: '#76C01B',
    500: '#68A818',
    600: '#559014',
    700: '#437811',
    800: '#30600D',
    900: '#1D4809',
  },
  warning: {
    50:  '#FEF3DC',
    100: '#FDE6B8',
    200: '#FBD27A',
    300: '#F8B940',
    400: '#F59E0B',
    500: '#D68B0A',
    600: '#B37408',
    700: '#905D06',
    800: '#6D4605',
    900: '#4A3003',
  },
  error: {
    50:  '#FDE8ED',
    100: '#F9BAC7',
    200: '#F68BA2',
    300: '#F0466B',
    400: '#ED1846',
    500: '#D01539',
    600: '#AF112F',
    700: '#8E0E26',
    800: '#6D0A1C',
    900: '#4C0712',
  },
  neutral: {
    0:   '#FFFFFF',
    50:  '#FAFAFA',
    100: '#F2F2F3',
    200: '#E9E9EA',
    300: '#DEDFE0',
    400: '#C9CACB',
    500: '#A8AAAC',
    600: '#939598',
    700: '#6B6D70',
    800: '#3A3B3D',
    900: '#0A0A0A',
  },
} as const

export const text = {
  primary: palette.primary[400],
  secondary: palette.secondary[400],
  success: palette.success[400],
  warning: palette.warning[400],
  error: palette.error[400],
  accent: palette.primary[400],
  neutralSubtle: palette.neutral[600],
  neutralDefault: palette.neutral[700],
  neutralStrong: palette.neutral[900],
  inverse: palette.neutral[0],
} as const

export const border = {
  primary: palette.primary[200],
  secondary: palette.secondary[200],
  success: palette.success[200],
  warning: palette.warning[200],
  error: palette.error[100],
  info: palette.primary[200],
  neutralSubtle: palette.neutral[200],
  neutralDefault: palette.neutral[300],
  neutralStrong: palette.neutral[400],
} as const

export const surface = {
  base: palette.neutral[0],
  primary: palette.primary[50],
  secondary: palette.secondary[50],
  success: palette.success[50],
  warning: palette.warning[50],
  error: palette.error[50],
  info: palette.primary[50],
  neutralSubtle: palette.neutral[50],
  neutralDefault: palette.neutral[100],
  neutralStrong: palette.neutral[200],
  neutralHover: palette.neutral[300],
} as const

export const spacing = {
  0: 0, '05': 2, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24,
  8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96,
} as const

export const typography = {
  fontFamilySans:
    "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
  fontFamilyMono: "'JetBrains Mono', Consolas, 'Liberation Mono', monospace",
  weight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeight: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
  size: { sm: 10, base: 12, lg: 14, xl: 18, '2xl': 22, '3xl': 28, '4xl': 36 },
} as const

export const radius = {
  none: 0, sm: 4, default: 8, md: 12, lg: 16, full: 9999,
} as const

export const controlHeight = { sm: 24, md: 32, lg: 40 } as const
export const iconSize = { sm: 14, md: 16, lg: 20 } as const

export const breakpoints = {
  xs: 350, sm: 400, md: 600, lg: 900, xl: 1200, xxl: 1800,
} as const

export const zIndex = {
  base: 0,
  stack1: 1, stack2: 2, stack3: 3, stack4: 4, stack5: 5,
  content: 100,
  navigation: 200,
  popover: 300,
  overlay: 400,
  surface: 500,
  surfacePopover: 600,
  notification: 700,
  aboveAntd: 1100,
} as const

export const tokens = {
  palette, text, border, surface, spacing, typography,
  radius, controlHeight, iconSize, breakpoints, zIndex,
} as const
