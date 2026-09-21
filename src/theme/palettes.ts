export type ThemeKey = 'emerald' | 'ocean' | 'rose' | 'midnight' | 'light';

export interface Palette {
  key: ThemeKey;
  label: string;
  emoji: string;
  isLight?: boolean;
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceAlt: string;
  surfaceHigh: string;
  border: string;
  borderLight: string;
  borderFocus: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  primaryGlowStrong: string;
  danger: string;
  dangerLight: string;
  dangerGlow: string;
  warning: string;
  warningGlow: string;
  info: string;
  infoGlow: string;
  success: string;
  white: string;
  black: string;
  transparent: string;
}

export const PALETTES: Record<ThemeKey, Palette> = {
  // 🌿 Émeraude (défaut, actuel)
  emerald: {
    key: 'emerald', label: 'Émeraude', emoji: '🌿',
    background: '#0A0E14', backgroundElevated: '#0F141C',
    surface: '#131820', surfaceAlt: '#1C232E', surfaceHigh: '#252D3A',
    border: '#232B38', borderLight: '#2D3646', borderFocus: '#10B981',
    text: '#F5F7FA', textSecondary: '#B8C1D1', textMuted: '#8B95A9', textFaint: '#5B6478',
    primary: '#10B981', primaryLight: '#34D399', primaryDark: '#059669',
    primaryGlow: 'rgba(16, 185, 129, 0.15)', primaryGlowStrong: 'rgba(16, 185, 129, 0.35)',
    danger: '#F43F5E', dangerLight: '#FB7185', dangerGlow: 'rgba(244, 63, 94, 0.15)',
    warning: '#F59E0B', warningGlow: 'rgba(245, 158, 11, 0.15)',
    info: '#06B6D4', infoGlow: 'rgba(6, 182, 212, 0.15)', success: '#10B981',
    white: '#FFFFFF', black: '#000000', transparent: 'transparent',
  },

  // 🌊 Océan (bleu)
  ocean: {
    key: 'ocean', label: 'Océan', emoji: '🌊',
    background: '#0A1220', backgroundElevated: '#0F1A2C',
    surface: '#131F33', surfaceAlt: '#1C2B44', surfaceHigh: '#253750',
    border: '#233044', borderLight: '#2D3F56', borderFocus: '#3B82F6',
    text: '#F5F7FA', textSecondary: '#B8C4D9', textMuted: '#8B9BB5', textFaint: '#5B6B85',
    primary: '#3B82F6', primaryLight: '#60A5FA', primaryDark: '#1D4ED8',
    primaryGlow: 'rgba(59, 130, 246, 0.15)', primaryGlowStrong: 'rgba(59, 130, 246, 0.35)',
    danger: '#EF4444', dangerLight: '#F87171', dangerGlow: 'rgba(239, 68, 68, 0.15)',
    warning: '#F59E0B', warningGlow: 'rgba(245, 158, 11, 0.15)',
    info: '#06B6D4', infoGlow: 'rgba(6, 182, 212, 0.15)', success: '#10B981',
    white: '#FFFFFF', black: '#000000', transparent: 'transparent',
  },

  // 🌸 Rose (magenta)
  rose: {
    key: 'rose', label: 'Rose', emoji: '🌸',
    background: '#140A17', backgroundElevated: '#1C0F22',
    surface: '#22142B', surfaceAlt: '#2E1B3A', surfaceHigh: '#3D2549',
    border: '#3A2444', borderLight: '#4A2E56', borderFocus: '#EC4899',
    text: '#FAF5F8', textSecondary: '#D4BCD0', textMuted: '#A88BA0', textFaint: '#705A6B',
    primary: '#EC4899', primaryLight: '#F472B6', primaryDark: '#BE185D',
    primaryGlow: 'rgba(236, 72, 153, 0.15)', primaryGlowStrong: 'rgba(236, 72, 153, 0.35)',
    danger: '#EF4444', dangerLight: '#F87171', dangerGlow: 'rgba(239, 68, 68, 0.15)',
    warning: '#F59E0B', warningGlow: 'rgba(245, 158, 11, 0.15)',
    info: '#06B6D4', infoGlow: 'rgba(6, 182, 212, 0.15)', success: '#10B981',
    white: '#FFFFFF', black: '#000000', transparent: 'transparent',
  },

  // 🌙 Minuit (violet profond)
  midnight: {
    key: 'midnight', label: 'Minuit', emoji: '🌙',
    background: '#0B0A1A', backgroundElevated: '#100F26',
    surface: '#161530', surfaceAlt: '#201E42', surfaceHigh: '#2C2856',
    border: '#262450', borderLight: '#332F5E', borderFocus: '#8B5CF6',
    text: '#F5F3FF', textSecondary: '#C0BAD9', textMuted: '#958DB5', textFaint: '#5B5685',
    primary: '#8B5CF6', primaryLight: '#A78BFA', primaryDark: '#6D28D9',
    primaryGlow: 'rgba(139, 92, 246, 0.15)', primaryGlowStrong: 'rgba(139, 92, 246, 0.35)',
    danger: '#F43F5E', dangerLight: '#FB7185', dangerGlow: 'rgba(244, 63, 94, 0.15)',
    warning: '#F59E0B', warningGlow: 'rgba(245, 158, 11, 0.15)',
    info: '#06B6D4', infoGlow: 'rgba(6, 182, 212, 0.15)', success: '#10B981',
    white: '#FFFFFF', black: '#000000', transparent: 'transparent',
  },

  // ☀️ Clair
  light: {
    key: 'light', label: 'Clair', emoji: '☀️', isLight: true,
    background: '#F5F7FA', backgroundElevated: '#FFFFFF',
    surface: '#FFFFFF', surfaceAlt: '#F0F3F8', surfaceHigh: '#E5EAF2',
    border: '#E0E5EE', borderLight: '#CDD4E0', borderFocus: '#10B981',
    text: '#0A0E14', textSecondary: '#3B4557', textMuted: '#6B7280', textFaint: '#9CA3AF',
    primary: '#059669', primaryLight: '#10B981', primaryDark: '#047857',
    primaryGlow: 'rgba(5, 150, 105, 0.12)', primaryGlowStrong: 'rgba(5, 150, 105, 0.3)',
    danger: '#DC2626', dangerLight: '#EF4444', dangerGlow: 'rgba(220, 38, 38, 0.12)',
    warning: '#D97706', warningGlow: 'rgba(217, 119, 6, 0.12)',
    info: '#0891B2', infoGlow: 'rgba(8, 145, 178, 0.12)', success: '#059669',
    white: '#FFFFFF', black: '#000000', transparent: 'transparent',
  },
};

export const DEFAULT_THEME: ThemeKey = 'emerald';
