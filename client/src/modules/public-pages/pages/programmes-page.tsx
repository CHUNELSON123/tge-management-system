"use client";

import { useEffect, useState } from "react";
import { BookOpen, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, Handshake, Leaf, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/modules/i18n/language-provider";
import type { TranslationKey } from "@/modules/i18n/messages";
import { publicPagesService, type PublicProgramme } from "../services/public-pages.service";

const approachSteps: { title: TranslationKey; copy: TranslationKey; icon: LucideIcon }[] = [
  { title: "programmeStepLearn", copy: "programmeStepLearnCopy", icon: BookOpen },
  { title: "programmeStepConnect", copy: "programmeStepConnectCopy", icon: Handshake },
  { title: "programmeStepApply", copy: "programmeStepApplyCopy", icon: BriefcaseBusiness },
  { title: "programmeStepGrow", copy: "programmeStepGrowCopy", icon: ChartNoAxesCombined },
  { title: "programmeStepImpact", copy: "programmeStepImpactCopy", icon: Leaf },
];

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { dateStyle: "medium" }).format(new Date(value));
}

function ProgrammeCard({ programme, index }: { programme: PublicProgramme; index: number }) {
  const { t, locale } = useLanguage();
  const icons = [Leaf, ChartNoAxesCombined, BookOpen, UsersRound];
  const ProgrammeIcon = icons[index % icons.length];

  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-xl border border-[#E3EAE6] bg-white shadow-[0_3px_16px_#10251a0c]">
      <div className="relative flex h-24 items-center justify-center overflow-hidden bg-[linear-gradient(120deg,#E5F0E8,#F7F9F7)]">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_40%,#8bb89a_0,transparent_30%),radial-gradient(circle_at_80%_70%,#b1cbbb_0,transparent_35%)]" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#087B49] text-white shadow-md">
          <ProgrammeIcon aria-hidden="true" size={24} strokeWidth={1.8} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold leading-6 text-[#075C32]">{programme.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-5 text-[#353F39]">
          {programme.description || t("programmeDescriptionUnavailable")}
        </p>
        {(programme.startDate || programme.endDate) && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#E9EEEB] pt-3 text-xs text-[#4D5852]">
            {programme.startDate && <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" size={15} className="text-[#087B49]" />{t("programmeStartDate")}: {formatDate(programme.startDate, locale)}</span>}
            {programme.endDate && <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" size={15} className="text-[#087B49]" />{t("programmeEndDate")}: {formatDate(programme.endDate, locale)}</span>}
          </div>
        )}
        <details className="group mt-4 border-t border-[#E9EEEB] pt-3">
          <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded-md border border-[#087B49] px-3 text-sm font-semibold text-[#087B49] hover:bg-[#F2F8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{t("viewProgramme")}</span>
            <span className="hidden group-open:inline">{t("hideProgramme")}</span>
          </summary>
          <div className="mt-3 rounded-md bg-[#F4F8F5] p-3 text-sm leading-5 text-[#39443E]">
            <p className="font-semibold">{programme.name}</p>
            <p className="mt-1">{programme.description || t("programmeDescriptionUnavailable")}</p>
            {programme.startDate && <p className="mt-2">{t("programmeStartDate")}: {formatDate(programme.startDate, locale)}</p>}
            {programme.endDate && <p>{t("programmeEndDate")}: {formatDate(programme.endDate, locale)}</p>}
          </div>
        </details>
      </div>
    </article>
  );
}

export default function ProgrammesPage() {
  const { t } = useLanguage();
  const [programmes, setProgrammes] = useState<PublicProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    publicPagesService.getProgrammes(controller.signal)
      .then(setProgrammes)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="bg-white text-[#151A18]">
      <section className="relative overflow-hidden bg-[#052719] text-white">
        <div className="absolute inset-y-0 right-0 hidden w-[65%] bg-[url('/public-pages/programmes-hero.png')] bg-cover bg-[position:60%_center] sm:block" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#052719_0%,rgba(5,39,25,.96)_33%,rgba(5,39,25,.18)_62%,rgba(5,39,25,.05)_100%)] sm:block" />
        <div className="relative mx-auto grid max-w-[1440px] sm:min-h-[245px] sm:items-center lg:min-h-[260px]">
          <div className="px-5 pb-6 pt-8 sm:max-w-[540px] sm:px-8 sm:py-8 lg:px-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#20C875]">{t("programmesEyebrow")}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{t("programmesHeadlineFirst")}<br />{t("programmesHeadlineSecond")}</h1>
            <p className="mt-3 max-w-[470px] text-sm leading-6 text-white/90">{t("programmesHeroCopy")}</p>
          </div>
          <div className="h-44 bg-[url('/public-pages/programmes-hero.png')] bg-cover bg-[position:72%_center] sm:hidden" role="img" aria-label={t("programmesHeroImage")} />
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10 lg:py-8" aria-labelledby="programmes-list-heading">
        <div className="flex items-center justify-between gap-4">
          <h2 id="programmes-list-heading" className="text-2xl font-bold">{t("programmesHeading")}</h2>
          {!loading && !failed && programmes.length > 0 && <span className="text-sm text-[#65716A]">{programmes.length}</span>}
        </div>

        {loading ? (
          <p role="status" className="mt-6 rounded-lg bg-[#F4F8F5] px-4 py-8 text-center text-sm text-[#4D5852]">{t("programmesLoading")}</p>
        ) : failed ? (
          <p role="alert" className="mt-6 rounded-lg border border-[#E7C7C3] bg-[#FFF7F6] px-4 py-8 text-center text-sm text-[#8B2E24]">{t("programmesError")}</p>
        ) : programmes.length === 0 ? (
          <p role="status" className="mt-6 rounded-lg bg-[#F4F8F5] px-4 py-8 text-center text-sm text-[#4D5852]">{t("programmesEmpty")}</p>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {programmes.map((programme, index) => <ProgrammeCard key={programme.slug} programme={programme} index={index} />)}
          </div>
        )}
      </section>

      <section className="bg-[#F1F6F3]">
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10 lg:py-8">
          <h2 className="text-lg font-bold">{t("programmeApproachHeading")}</h2>
          <ol className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {approachSteps.map(({ title, copy, icon: Icon }, index) => (
              <li key={title} className="relative flex flex-col items-center text-center">
                {index < approachSteps.length - 1 && <span aria-hidden="true" className="absolute left-[65%] top-7 hidden h-px w-[70%] border-t border-dotted border-[#9CB9A6] lg:block" />}
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#078348] shadow-[0_2px_10px_#183b2815]"><Icon aria-hidden="true" size={27} strokeWidth={1.7} /></span>
                <h3 className="mt-2 text-sm font-bold text-[#075C32]">{index + 1}. {t(title)}</h3>
                <p className="mt-1 max-w-[220px] text-xs leading-4 text-[#4D5852]">{t(copy)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#006B3B] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-5 py-6 text-center sm:px-8 md:flex-row md:justify-center md:text-left lg:px-10">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/75"><UsersRound aria-hidden="true" size={30} /></div>
          <div className="max-w-xl"><h2 className="text-xl font-bold">{t("programmesCtaTitle")}</h2><p className="mt-1 text-sm leading-5 text-white/90">{t("programmesCtaCopy")}</p></div>
          <Link href="/membership-application" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-[#006B3B] hover:bg-[#EFF8F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#006B3B]">{t("becomeMember")}</Link>
        </div>
      </section>
    </main>
  );
}
