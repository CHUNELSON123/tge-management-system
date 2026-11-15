"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/modules/i18n/language-provider";
import type { TranslationKey } from "@/modules/i18n/messages";

const destinationLabels: Record<string, TranslationKey> = {
  profile: "memberProfile",
  programmes: "memberProgrammes",
  events: "memberEvents",
  mentorship: "memberMentorship",
  resources: "memberResources",
  messages: "memberMessages",
  notifications: "memberNotifications",
  "business-directory": "memberBusinessDirectory",
  businesses: "memberBusinesses",
  settings: "memberSettings",
  help: "memberHelp",
};

export function MemberDestinationPage() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const firstSegment = pathname.split("/").filter(Boolean)[1] ?? "";
  const titleKey = destinationLabels[firstSegment] ?? "memberPortal";

  return (
    <section aria-labelledby="member-destination-title">
      <h1 id="member-destination-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{t(titleKey)}</h1>
      <div className="mt-6 rounded-xl border border-[#DCE8E0] bg-[#F5F9F6] p-5 sm:p-6">
        <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#53645A]">{t("memberPageStatus")}</p>
        <h2 className="mt-3 text-lg font-semibold text-[#17211B]">{t("memberPageUnavailableTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#53645A]">{t("memberPageUnavailableCopy")}</p>
      </div>
    </section>
  );
}
