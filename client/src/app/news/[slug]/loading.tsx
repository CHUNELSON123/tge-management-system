"use client";

import { useLanguage } from "@/modules/i18n/language-provider";

export default function Loading() {
  const { t } = useLanguage();
  return <main className="p-12 text-center text-sm" role="status">{t("articleLoading")}</main>;
}
