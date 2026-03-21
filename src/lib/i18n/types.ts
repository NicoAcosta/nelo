export type Locale = "en" | "es";

export type Translations = { [key: string]: string };

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "nelo-locale";
