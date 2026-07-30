import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const colors = {
  primary: '#0066A1',
  primaryLight: '#3399CC',
  primaryDark: '#004D7A',
  secondary: '#00A86B',
  secondaryLight: '#33CC8F',
  secondaryDark: '#008050',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  info: '#17A2B8',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2F5',
  text: '#1A1A2E',
  textSecondary: '#6C757D',
  textTertiary: '#ADB5BD',
  textInverse: '#FFFFFF',
  border: '#E1E5EB',
  borderLight: '#F0F2F5',
  divider: '#E8ECF0',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  cardShadow: 'rgba(0, 102, 161, 0.08)',
  ripple: 'rgba(0, 102, 161, 0.12)',
  statusScheduled: '#0066A1',
  statusCompleted: '#28A745',
  statusCancelled: '#DC3545',
  statusPending: '#FFC107',
  statusInProgress: '#17A2B8',
  abnormalHigh: '#DC3545',
  abnormalLow: '#FFC107',
  normal: '#28A745',
  gradientStart: '#0066A1',
  gradientEnd: '#004D7A',
  facebook: '#1877F2',
  google: '#DB4437',
  apple: '#000000',
  whatsapp: '#25D366',
  twitter: '#1DA1F2',
};

export const darkColors = {
  primary: '#4DA8D6',
  primaryLight: '#66B8E0',
  primaryDark: '#0066A1',
  secondary: '#33CC8F',
  secondaryLight: '#66D9A8',
  secondaryDark: '#00A86B',
  success: '#34CE57',
  warning: '#FFCA2C',
  error: '#E74C5E',
  info: '#3DD5F3',
  background: '#0D1117',
  surface: '#161B22',
  surfaceAlt: '#21262D',
  text: '#F0F6FC',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  textInverse: '#0D1117',
  border: '#30363D',
  borderLight: '#21262D',
  divider: '#21262D',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  cardShadow: 'rgba(0, 0, 0, 0.2)',
  ripple: 'rgba(77, 168, 214, 0.16)',
  statusScheduled: '#4DA8D6',
  statusCompleted: '#34CE57',
  statusCancelled: '#E74C5E',
  statusPending: '#FFCA2C',
  statusInProgress: '#3DD5F3',
  abnormalHigh: '#E74C5E',
  abnormalLow: '#FFCA2C',
  normal: '#34CE57',
  gradientStart: '#4DA8D6',
  gradientEnd: '#0066A1',
  facebook: '#1877F2',
  google: '#DB4437',
  apple: '#FFFFFF',
  whatsapp: '#25D366',
  twitter: '#1DA1F2',
};

export const typography = {
  fontFamily: {
    arabic: {
      regular: 'NotoNaskhArabic-Regular',
      medium: 'NotoNaskhArabic-Medium',
      bold: 'NotoNaskhArabic-Bold',
    },
    english: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semibold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    title: 24,
    h1: 28,
    h2: 24,
    h3: 20,
    h4: 18,
    display: 32,
    giant: 48,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  section: 48,
  screen: 16,
};

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
  pill: 50,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    mass: 1,
    stiffness: 150,
  },
};

export const dimensions = {
  screenWidth: width,
  screenHeight: height,
  isSmallDevice: width < 375,
  isTablet: width >= 768,
  bottomNavHeight: 60,
  headerHeight: 56,
  statusBarHeight: Platform.OS === 'ios' ? 44 : 24,
  contentPadding: spacing.screen,
};

export const theme = {
  light: {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animation,
    dimensions,
    isDark: false,
  },
  dark: {
    colors: darkColors,
    typography,
    spacing,
    borderRadius,
    shadows: {
      ...shadows,
      md: {
        ...shadows.md,
        shadowColor: '#000',
        shadowOpacity: 0.3,
      },
      lg: {
        ...shadows.lg,
        shadowColor: '#000',
        shadowOpacity: 0.4,
      },
    },
    animation,
    dimensions,
    isDark: true,
  },
};

export type Theme = typeof theme.light;
export type ColorScheme = keyof typeof theme;
