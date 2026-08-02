/**
 * Shared design tokens — unified, modern UI language across both apps.
 * Import these instead of hard-coding colors, radii, and spacing.
 */
export const colors = {
  // Neutrals
  bg: '#F6F7FB',
  surface: '#FFFFFF',
  border: '#E9ECF3',
  borderStrong: '#DCE1EC',
  text: '#111827',
  textSecondary: '#5B6577',
  textMuted: '#9AA3B2',
  inputBg: '#F3F5F9',

  // Accent (passenger = blue)
  primary: '#3B82F6',
  primaryDark: '#1D4ED8',
  primarySoft: '#EAF2FF',
  primaryBorder: '#C7DBFF',

  // Semantic
  success: '#10B981',
  successSoft: '#E6F8F1',
  danger: '#EF4444',
  dangerSoft: '#FDECEC',
  warning: '#F59E0B',
  warningSoft: '#FFF6E5',
  info: '#6366F1',
  infoSoft: '#EEF0FF',

  // Map accent
  mapPin: '#4F46E5',
  shadow: '#0B1220',
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const shadow = {
  card: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  pop: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

export const type = {
  title: { fontSize: 22, fontWeight: '800' as const, color: '#111827' },
  h2: { fontSize: 18, fontWeight: '700' as const, color: '#111827' },
  label: { fontSize: 12, fontWeight: '600' as const, color: '#5B6577' },
  body: { fontSize: 15, fontWeight: '500' as const, color: '#111827' },
  muted: { fontSize: 13, fontWeight: '500' as const, color: '#9AA3B2' },
} as const;
