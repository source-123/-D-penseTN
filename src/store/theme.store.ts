import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PALETTES, DEFAULT_THEME, type ThemeKey, type Palette } from '@/theme/palettes';

const KEY = '@depensetn/theme';

interface ThemeState {
  themeKey: ThemeKey;
  palette: Palette;
  hydrated: boolean;
  setTheme: (key: ThemeKey) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeKey: DEFAULT_THEME,
  palette: PALETTES[DEFAULT_THEME],
  hydrated: false,

  hydrate: async () => {
    try {
      const saved = (await AsyncStorage.getItem(KEY)) as ThemeKey | null;
      const key = saved && saved in PALETTES ? saved : DEFAULT_THEME;
      set({ themeKey: key, palette: PALETTES[key], hydrated: true });
    } catch {
      set({ themeKey: DEFAULT_THEME, palette: PALETTES[DEFAULT_THEME], hydrated: true });
    }
  },

  setTheme: async (key) => {
    set({ themeKey: key, palette: PALETTES[key] });
    try {
      await AsyncStorage.setItem(KEY, key);
    } catch {}
  },
}));

/** Hook principal : récupère la palette active + setter */
export function useTheme() {
  const palette = useThemeStore((s) => s.palette);
  const themeKey = useThemeStore((s) => s.themeKey);
  const setTheme = useThemeStore((s) => s.setTheme);
  return { colors: palette, themeKey, setTheme, isLight: !!palette.isLight };
}
