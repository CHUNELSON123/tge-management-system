"use client";

import { useLanguage } from "@/modules/i18n/language-provider";

export default function EventDetailLoading() {
  const { t } = useLanguage();
  return <main className="mx-auto max-w-5xl px-5 py-16 text-center text-sm text-[#56615B]" role="status">{t("eventLoading")}</main>;
}
