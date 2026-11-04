"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Newspaper,
  Store,
  UsersRound,
} from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { publicPagesService, type HomePreviews, type PublicPreviewItem } from "../services/public-pages.service";

const previews = [
  { title: "homeProgrammes", empty: "homeProgrammesEmpty", href: "/programmes", icon: BookOpen, action: "viewProgrammes" },
  { title: "homeEvents", empty: "homeEventsEmpty", href: "/events", icon: CalendarDays, action: "viewEvents" },
  { title: "homeBusinesses", empty: "homeBusinessesEmpty", href: "/business-directory", icon: Store, action: "viewBusinesses" },
  { title: "homeNews", empty: "homeNewsEmpty", href: "/news", icon: Newspaper, action: "viewNews" },
] as const;

export default function Home() {
  const { t, locale } = useLanguage();
  const [homePreviews, setHomePreviews] = useState<HomePreviews | null>(null);
  const [previewsLoading, setPreviewsLoading] = useState(true);
  const [previewsFailed, setPreviewsFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    publicPagesService.getHomePreviews(controller.signal)
      .then(setHomePreviews)
      .catch(() => {
        if (!controller.signal.aborted) setPreviewsFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setPreviewsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const previewContent: Record<string, PublicPreviewItem[]> = {
    homeProgrammes: homePreviews?.programmes ?? [],
    homeEvents: homePreviews?.events ?? [],
    homeBusinesses: homePreviews?.businesses ?? [],
    homeNews: homePreviews?.news ?? [],
  };

  return (
    <main className="bg-white text-[#151A18]">
      <section className="relative isolate min-h-[470px] overflow-hidden bg-[#F4F8F5] lg:min-h-[430px]">
        <div className="absolute inset-y-0 right-0 -z-10 w-full bg-[linear-gradient(90deg,#f4f8f5_0%,#f4f8f5_42%,rgba(244,248,245,.82)_54%,rgba(244,248,245,0)_72%),url('/public-pages/home-hero.png')] bg-cover bg-center lg:w-[59%] lg:bg-[linear-gradient(90deg,#f4f8f5_0%,rgba(244,248,245,.8)_14%,rgba(244,248,245,0)_42%),url('/public-pages/home-hero.png')]" />
        <div className="mx-auto flex min-h-[470px] max-w-[1440px] items-center px-6 py-12 sm:px-10 lg:min-h-[430px] lg:px-14">
          <div className="max-w-[590px]">
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
              {t("homeHeadlineFirst")}<br />
              <span className="text-[#087B49]">{t("homeHeadlineSecond")}</span>
            </h1>
            <p className="mt-5 max-w-[510px] text-base leading-6 text-[#303A35] sm:text-[17px] sm:leading-7">
              {t("homeHeroCopy")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/programmes" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md bg-[#008448] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#006B3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2">
                <ArrowRight aria-hidden="true" size={18} />{t("exploreProgrammes")}
              </Link>
              <Link href="/business-directory" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-md border border-[#008448] bg-white/80 px-5 text-sm font-semibold text-[#006B3B] transition-colors hover:bg-[#EFF8F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2">
                <Store aria-hidden="true" size={18} />{t("discoverBusinesses")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-7 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:px-10 lg:py-7">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <div className="hidden h-28 w-44 shrink-0 rounded-lg bg-[url('/public-pages/home-about.png')] bg-cover bg-center sm:block" role="img" aria-label={t("tgeCommunityImage")} />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{t("aboutTge")}</p>
            <h2 className="mt-1 text-xl font-bold leading-tight">{t("homeAboutTitle")}</h2>
            <p className="mt-2 max-w-xl text-sm leading-5 text-[#4D5651]">{t("homeAboutCopy")}</p>
            <Link href="/about" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#087B49] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">
              {t("learnAboutUs")} <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#E7ECE9] bg-white p-4 shadow-[0_3px_18px_#10251a0c] sm:grid-cols-4 sm:gap-2 sm:p-5">
          {[
            [UsersRound, "homeFocusEntrepreneurs"],
            [BookOpen, "homeFocusTraining"],
            [UsersRound, "homeFocusCollaboration"],
            [Store, "homeFocusSustainability"],
          ].map(([Icon, key]) => {
            const FocusIcon = Icon as typeof UsersRound;
            return <div key={key as string} className="flex items-center gap-2 border-[#E4EAE6] px-1 py-2 sm:border-r sm:last:border-0">
              <FocusIcon aria-hidden="true" className="h-8 w-8 shrink-0 text-[#078348]" strokeWidth={1.5} />
              <span className="text-xs font-semibold leading-4 text-[#26332C]">{t(key as "homeFocusEntrepreneurs")}</span>
            </div>;
          })}
        </div>
      </section>

      <section aria-label={t("publicContentPreviews")} className="mx-auto grid max-w-[1440px] gap-5 px-5 pb-9 sm:px-8 md:grid-cols-2 xl:grid-cols-4 xl:px-10">
        {previews.map(({ title, empty, href, icon: Icon, action }) => (
          <article key={title} className="flex min-h-[238px] flex-col rounded-lg border border-[#E7ECE9] bg-white p-4 shadow-[0_2px_12px_#10251a0a]">
            <div className="flex items-center justify-between gap-2 border-b border-[#E9EEEB] pb-3">
              <h2 className="flex items-center gap-2 text-base font-bold"><Icon aria-hidden="true" className="h-5 w-5 text-[#078348]" />{t(title)}</h2>
              <Link href={href} className="shrink-0 text-xs font-semibold text-[#078348] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{t("viewAll")}</Link>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-3 px-1 py-4">
              {previewsLoading ? (
                <p role="status" className="text-center text-sm text-[#5B6560]">{t("loadingPublicPreviews")}</p>
              ) : previewsFailed ? (
                <p role="status" className="text-center text-sm text-[#8B2E24]">{t("publicPreviewsError")}</p>
              ) : previewContent[title].length > 0 ? (
                previewContent[title].map((item) => (
                  <Link key={`${item.href}-${item.title}`} href={item.href} className="rounded-md border border-[#E9EEEB] px-3 py-2 hover:border-[#A5CBB4] hover:bg-[#F7FBF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">
                    <span className="block text-sm font-semibold leading-5 text-[#26332C]">{item.title}</span>
                    {item.summary && <span className="mt-1 line-clamp-2 block text-xs leading-4 text-[#5B6560]">{item.summary}</span>}
                    {item.date && <time className="mt-1 block text-[11px] text-[#69736D]" dateTime={item.date}>{new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { dateStyle: "medium" }).format(new Date(item.date))}</time>}
                  </Link>
                ))
              ) : (
                <p className="mx-auto max-w-[230px] text-center text-sm leading-5 text-[#5B6560]">{t(empty)}</p>
              )}
            </div>
            <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-[#087B49] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">
              {t(action)} <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </article>
        ))}
      </section>

      <section className="bg-[#006B3B] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-5 px-5 py-7 text-center sm:px-8 md:flex-row md:justify-center md:text-left lg:gap-8 lg:px-10">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/75"><UsersRound aria-hidden="true" size={30} /></div>
          <div className="max-w-xl">
            <h2 className="text-xl font-bold">{t("homeCommunityTitle")}</h2>
            <p className="mt-1 text-sm leading-5 text-white/90">{t("homeCommunityCopy")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/membership-application" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-[#006B3B] hover:bg-[#EFF8F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#006B3B]">{t("becomeMember")}</Link>
            <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white px-4 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#006B3B]">{t("contactUs")}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
