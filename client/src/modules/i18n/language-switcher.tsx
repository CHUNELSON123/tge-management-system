"use client";

import { useLanguage } from "./language-provider";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage();
  return (
    <div className={`inline-flex items-center gap-1 rounded-md border border-current/20 p-1 text-xs ${className}`} role="group" aria-label={t("language")}>
      <button type="button" onClick={() => setLocale("en")} aria-label={t("chooseEnglish")} aria-pressed={locale === "en"} className={`rounded px-2 py-1 font-semibold ${locale === "en" ? "bg-[#0D6339] text-white" : "hover:bg-black/5"}`}>EN</button>
      <button type="button" onClick={() => setLocale("fr")} aria-label={t("chooseFrench")} aria-pressed={locale === "fr"} className={`rounded px-2 py-1 font-semibold ${locale === "fr" ? "bg-[#0D6339] text-white" : "hover:bg-black/5"}`}>FR</button>
    </div>
  );
}
