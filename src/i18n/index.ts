import { ru } from './ru';
import { en } from './en';

export const LOCALES = ['ru', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ru';

/** Deep-widen the `as const` ru dictionary so en can provide its own strings. */
type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};
export type Dictionary = DeepString<typeof ru>;

const dictionaries: Record<Locale, Dictionary> = { ru, en };

export function useTranslations(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Build a locale-aware path: localePath('en', '/calculators/syntax'). */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? normalized : `/${locale}${normalized}`;
}
