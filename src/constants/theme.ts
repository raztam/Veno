import { Platform, type TextStyle } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#FFFFFF',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    tint: '#208AEF',
    border: '#E0E1E6',
    error: '#E5484D',
    success: '#30A46C',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    tint: '#4DA3FF',
    border: '#2E3135',
    error: '#F2555A',
    success: '#3DD68C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorScheme = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'ui-rounded',
    mono: 'Menlo',
  },
  android: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    rounded: 'System',
    mono: 'monospace',
  },
})!;

export const Typography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    fontFamily: Fonts.sans,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    fontFamily: Fonts.sans,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    fontFamily: Fonts.sans,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    fontFamily: Fonts.sans,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    fontFamily: Fonts.sans,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: Fonts.sans,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: Fonts.sans,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    fontFamily: Fonts.sans,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400',
    fontFamily: Fonts.sans,
  },
  mono: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    fontFamily: Fonts.mono,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyScale = keyof typeof Typography;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
