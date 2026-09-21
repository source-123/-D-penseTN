import { Platform } from 'react-native';

/**
 * Ombres cross-platform (web + natif).
 */
function makeShadow(opacity: number, radius: number, y: number, color = '#000') {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0 ${y}px ${radius}px rgba(${hexToRgb(color)}, ${opacity})`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: y },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: y,
  };
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export const shadows = {
  card: makeShadow(0.25, 16, 4, '#000'),
  cardLight: makeShadow(0.15, 8, 2, '#000'),
  fab: makeShadow(0.35, 20, 6, '#10B981'),
  danger: makeShadow(0.3, 16, 4, '#F43F5E'),
  modal: makeShadow(0.5, 30, 10, '#000'),
};
