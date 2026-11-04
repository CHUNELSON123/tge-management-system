"use client";

import messages from "@/modules/public-pages/business-messages.json";
import { useLanguage } from "@/modules/i18n/language-provider";

export default function Loading() {
  const { locale } = useLanguage();
  const label = locale === "fr" ? messages.fr.businessDetailsLoading : messages.en.businessDetailsLoading;
  return <main className="mx-auto max-w-5xl px-5 py-16 text-center text-sm text-[#56615B]" role="status">{label}</main>;
}
