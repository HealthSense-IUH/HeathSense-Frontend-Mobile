/**
 * HealthSense Design System Tokens
 * Derived from Stitch Project 'HealthSense' (Clinical Clarity & Modern Pulse)
 * Specified in DESIGN.md
 */

export const THEME = {
  colors: {
    // Primary Brand (Medical Trust Blue)
    primary: '#0D6EFD',
    primaryM3: '#0057CD',
    primaryContainer: '#0D6EFD',
    onPrimary: '#FFFFFF',
    primaryFixed: '#DAE2FF',
    primaryFixedDim: '#B1C5FF',
    onPrimaryFixed: '#001946',

    // Secondary Brand (Cyan / Clinical Teal - SpO2 & Telemetry)
    secondary: '#06B6D4',
    secondaryM3: '#00687A',
    secondaryContainer: '#57DFFE',
    onSecondary: '#FFFFFF',
    secondaryFixed: '#ACEDFF',
    secondaryFixedDim: '#4CD7F6',

    // Tertiary / Normal Flora (Emerald - Sinus Rhythm & Health Goals)
    tertiary: '#10B981',
    tertiaryM3: '#006C49',
    tertiaryContainer: '#00885D',
    onTertiary: '#FFFFFF',
    tertiaryFixed: '#6FFBBE',
    tertiaryFixedDim: '#4EDEA3',

    // Status / Clinical Tiers
    statusNormal: '#10B981',
    statusWarning: '#F59E0B',
    statusCritical: '#EF4444',
    statusUncertain: '#64748B',

    // Error & Critical (Coral Alert / AFib)
    error: '#BA1A1A',
    errorCoral: '#EF4444',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#93000A',

    // Canvas, Surfaces & Cards
    canvas: '#F8F9FF',
    canvasAlt: '#F8FAFC',
    card: '#FFFFFF',
    surfaceDim: '#CBDBF5',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#EFF4FF',
    surfaceContainer: '#E5EEFF',
    surfaceContainerHigh: '#DCE9FF',
    surfaceContainerHighest: '#D3E4FE',
    surfaceVariant: '#D3E4FE',

    // Text & Slate Neutrals
    textPrimary: '#0B1C30',
    textSlate900: '#0F172A',
    textSecondary: '#424655',
    textMuted: '#64748B',
    textLight: '#94A3B8',

    // Borders & Outlines
    outline: '#727787',
    outlineVariant: '#C2C6D8',
    borderSubtle: '#E2E8F0',
  },

  status: {
    NORMAL: {
      color: '#10B981',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      label: 'Bình thường',
      shortLabel: 'Nhịp xoang đều',
    },
    AFIB_SUSPECTED: {
      color: '#F59E0B',
      bg: '#FFFBEB',
      border: '#FDE68A',
      label: 'Nghi ngờ rung tâm nhĩ',
      shortLabel: 'Nghi ngờ AFib',
    },
    AFIB_RISK: {
      color: '#EF4444',
      bg: '#FEF2F2',
      border: '#FECACA',
      label: 'Nguy cơ rung tâm nhĩ',
      shortLabel: 'Rung nhĩ (AFib)',
    },
    UNCERTAIN: {
      color: '#64748B',
      bg: '#F8FAFC',
      border: '#E2E8F0',
      label: 'Không xác định / Không rõ ràng',
      shortLabel: 'Không chắc chắn',
    },
  },

  layout: {
    screenMargin: 20, // 1.25rem (px-5)
    cardPadding: 20,  // 1.25rem
    cardPaddingCompact: 16, // 1rem
    dockHeight: 72,   // 4.5rem
    fabSize: 56,      // 56x56px circular
  },

  radii: {
    sm: 4,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: 'rgba(15, 23, 42, 0.05)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 2,
    },
    fab: {
      shadowColor: 'rgba(13, 110, 253, 0.35)',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 8,
    },
  },
} as const;

export type ThemeType = typeof THEME;
