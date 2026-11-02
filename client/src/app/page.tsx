"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/modules/i18n/language-switcher";
import { useLanguage } from "@/modules/i18n/language-provider";

export default function Home() {
  const { t } = useLanguage();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center text-[#173D2C]">
      <div className="absolute right-6 top-6"><LanguageSwitcher /></div>
      <h1 className="max-w-2xl text-4xl font-bold">{t("homeIntro")}</h1>
      <p className="mt-4 max-w-xl text-lg text-zinc-600">{t("homeGuidance")}</p>
      <Link href="/login" className="mt-8 rounded-lg bg-[#0D6339] px-6 py-3 font-semibold text-white">{t("openLogin")}</Link>
    </main>
  );
}
