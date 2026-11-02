"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isLocale, messages, translateApiMessage, type Locale, type TranslationKey } from "./messages";

const STORAGE_KEY = "tge.language";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  translateMessage: (message: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (active) {
        if (isLocale(saved)) setLocaleState(saved);
        setPreferenceLoaded(true);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (preferenceLoaded) window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, preferenceLoaded]);

  useEffect(() => {
    function syncLocale(event: StorageEvent) {
      if (event.key === STORAGE_KEY && isLocale(event.newValue)) {
        setLocaleState(event.newValue);
      }
    }
    window.addEventListener("storage", syncLocale);
    return () => window.removeEventListener("storage", syncLocale);
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    setLocale: (next) => setLocaleState(next),
    t: (key) => messages[locale][key],
    translateMessage: (message) => translateApiMessage(message, locale),
  }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider.");
  return value;
}
