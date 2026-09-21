import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';
import { type Lang, detectLang, setI18nLang, isRTL } from '@/i18n';

const KEY = '@depensetn/language';

interface LangState {
  lang: Lang;
  hydrated: boolean;
  setLang: (lang: Lang) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useLangStore = create<LangState>((set) => ({
  lang: 'fr',
  hydrated: false,

  hydrate: async () => {
    try {
      const saved = (await AsyncStorage.getItem(KEY)) as Lang | null;
      const lang = saved && ['fr', 'en', 'ar'].includes(saved) ? saved : detectLang();
      setI18nLang(lang);

      // Config RTL (natif seulement)
      const shouldRTL = isRTL(lang);
      if (Platform.OS !== 'web' && I18nManager.isRTL !== shouldRTL) {
        I18nManager.allowRTL(shouldRTL);
        I18nManager.forceRTL(shouldRTL);
      }

      set({ lang, hydrated: true });
    } catch {
      const lang = detectLang();
      setI18nLang(lang);
      set({ lang, hydrated: true });
    }
  },

  setLang: async (lang) => {
    setI18nLang(lang);
    set({ lang });

    const shouldRTL = isRTL(lang);
    if (Platform.OS !== 'web' && I18nManager.isRTL !== shouldRTL) {
      I18nManager.allowRTL(shouldRTL);
      I18nManager.forceRTL(shouldRTL);
      // Un reload est nécessaire pour appliquer RTL natif
    }

    try {
      await AsyncStorage.setItem(KEY, lang);
    } catch {}
  },
}));

/**
 * Hook principal : à utiliser dans chaque composant pour la traduction.
 * Re-render automatique quand la langue change.
 */
export function useT() {
  const lang = useLangStore((s) => s.lang);
  // Force re-render quand la langue change
  return {
    t: (key: string, opts?: Record<string, any>) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { i18n } = require('@/i18n');
      return i18n.t(key, opts);
    },
    lang,
    isRTL: lang === 'ar',
  };
}
