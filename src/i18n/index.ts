import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import fr from './fr';
import en from './en';
import ar from './ar';

export type Lang = 'fr' | 'en' | 'ar';

export const SUPPORTED: Lang[] = ['fr', 'en', 'ar'];

export const i18n = new I18n({ fr, en, ar });
i18n.enableFallback = true;
i18n.defaultLocale = 'fr';

/** Détecte la langue système */
export function detectLang(): Lang {
  const locales = getLocales();
  const code = locales[0]?.languageCode ?? 'fr';
  return (SUPPORTED.includes(code as Lang) ? code : 'fr') as Lang;
}

export function setI18nLang(lang: Lang) {
  i18n.locale = lang;
}

/** Helper de traduction */
export function t(key: string, options?: Record<string, any>): string {
  return i18n.t(key, options);
}

/** Retourne les infos de direction */
export function isRTL(lang: Lang): boolean {
  return lang === 'ar';
}
