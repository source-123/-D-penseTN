import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n, type Lang, detectLang, setI18nLang, isRTL } from '@/i18n';

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

      // DEBUG: RTL désactivé pour isoler le crash Android
      // const shouldRTL = isRTL(lang);
      // if (Platform.OS !== 'web' && I18nManager.isRTL !== shouldRTL) {
      //   I18nManager.allowRTL(shouldRTL);
      //   I18nManager.forceRTL(shouldRTL);
      // }

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

    // DEBUG: RTL désactivé pour isoler le crash Android
    // const shouldRTL = isRTL(lang);
    // if (Platform.OS !== 'web' && I18nManager.isRTL !== shouldRTL) {
    //   I18nManager.allowRTL(shouldRTL);
    //   I18nManager.forceRTL(shouldRTL);
    // }

    try {
      await AsyncStorage.setItem(KEY, lang);
    } catch {}
  },
}));

export function useT() {
  const lang = useLangStore((s) => s.lang);
  return {
    t: (key: string, opts?: Record<string, any>) => i18n.t(key, opts),
    lang,
    isRTL: lang === 'ar',
  };
}
