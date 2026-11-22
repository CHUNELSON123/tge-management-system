"use client";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { LanguageSwitcher } from "@/modules/i18n/language-switcher";

export function SiteChrome() {
  return <>
    <SiteHeader />
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-[60] hidden rounded-lg border border-[#D1DDD4] bg-white/95 p-1 text-[#1C1C1A] shadow-lg backdrop-blur sm:right-6 lg:block">
      <LanguageSwitcher className="border-0 p-0" />
    </div>
  </>;
}

export function SiteFooterChrome() {
  return <SiteFooter />;
}
