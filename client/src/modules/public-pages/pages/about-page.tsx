"use client";

import Link from "next/link";
import { ArrowRight, Eye, HandHeart, Lightbulb, Target, UsersRound } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";

const values = [
  { title: "aboutInclusion", copy: "aboutInclusionCopy", icon: UsersRound },
  { title: "aboutCollaboration", copy: "aboutCollaborationCopy", icon: HandHeart },
  { title: "aboutInnovation", copy: "aboutInnovationCopy", icon: Lightbulb },
  { title: "aboutIntegrity", copy: "aboutIntegrityCopy", icon: Target },
  { title: "aboutImpact", copy: "aboutImpactCopy", icon: Eye },
] as const;

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <main className="bg-white text-[#151A18]">
      <section className="relative isolate min-h-[340px] overflow-hidden bg-[#06291D] text-white sm:min-h-[390px]">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,34,23,.98)_0%,rgba(3,34,23,.92)_43%,rgba(3,34,23,.28)_73%,rgba(3,34,23,.12)_100%),url('/public-pages/about-hero.png')] bg-cover bg-center" />
        <div className="mx-auto flex min-h-[340px] max-w-[1440px] items-center px-6 py-12 sm:min-h-[390px] sm:px-10 lg:px-14">
          <div className="max-w-[540px]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#39C477]">{t("aboutUs")}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-[40px]">{t("aboutHeadlineFirst")}<br />{t("aboutHeadlineSecond")}</h1>
            <p className="mt-4 max-w-[500px] text-sm leading-6 text-white/90 sm:text-[15px] sm:leading-6">{t("aboutHeroCopy")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[290px_1fr_345px] lg:items-center lg:gap-8 lg:px-10 lg:py-8">
        <div className="relative min-h-[230px] overflow-hidden rounded-xl bg-[url('/public-pages/about-story-quebec.png')] bg-cover bg-center sm:min-h-[300px]" role="img" aria-label={t("aboutQuebecImage")}>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06291D]/95 to-transparent px-4 pb-4 pt-12">
            <p className="text-sm font-semibold text-white">{t("aboutOrganisation")}</p>
          </div>
        </div>

        <article>
          <p className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{t("aboutOurStory")}</p>
          <h2 className="mt-1 text-2xl font-bold leading-tight">{t("aboutStoryTitle")}</h2>
          <p className="mt-3 text-sm leading-6 text-[#4D5651]">{t("aboutStoryCopyOne")}</p>
          <p className="mt-3 text-sm leading-6 text-[#4D5651]">{t("aboutStoryCopyTwo")}</p>
          <Link href="/programmes" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#0A8148] px-3 text-sm font-semibold text-[#087B49] hover:bg-[#F2F8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2">
            {t("aboutExploreWork")} <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </article>

        <aside className="space-y-4 rounded-xl bg-[#F3F7F5] p-4 sm:p-5">
          <section className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#087B49] shadow-sm"><Target aria-hidden="true" size={25} /></span>
            <div><h2 className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{t("aboutMission")}</h2><p className="mt-1 text-sm leading-5 text-[#38423D]">{t("aboutMissionCopy")}</p></div>
          </section>
          <section className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#087B49] shadow-sm"><Eye aria-hidden="true" size={25} /></span>
            <div><h2 className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{t("aboutVision")}</h2><p className="mt-1 text-sm leading-5 text-[#38423D]">{t("aboutVisionCopy")}</p></div>
          </section>
          <section className="flex gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#087B49] shadow-sm"><HandHeart aria-hidden="true" size={25} /></span>
            <div><h2 className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{t("aboutValues")}</h2><p className="mt-1 text-sm leading-5 text-[#38423D]">{t("aboutValuesSummary")}</p></div>
          </section>
        </aside>
      </section>

      <section className="bg-[#F5F8F6]">
        <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10 lg:py-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{t("aboutValues")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {values.map(({ title, copy, icon: Icon }) => (
              <article key={title} className="rounded-lg border border-[#E5ECE8] bg-white p-4">
                <Icon aria-hidden="true" className="h-7 w-7 text-[#078348]" strokeWidth={1.6} />
                <h3 className="mt-2 text-sm font-bold text-[#17432D]">{t(title)}</h3>
                <p className="mt-1 text-xs leading-5 text-[#59635E]">{t(copy)}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 border-t border-[#DDE5E0] pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{t("aboutImpact")}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[#46514B]">{t("aboutImpactStatement")}</p>
            <p className="mt-2 text-xs text-[#66716B]">{t("aboutImpactNote")}</p>
          </div>
        </div>
      </section>

      <section className="bg-[#006B3B] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-4 px-5 py-6 text-center sm:px-8 md:flex-row md:justify-center md:text-left lg:px-10">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/75"><UsersRound aria-hidden="true" size={30} /></div>
          <div className="max-w-xl"><h2 className="text-xl font-bold">{t("homeCommunityTitle")}</h2><p className="mt-1 text-sm leading-5 text-white/90">{t("homeCommunityCopy")}</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/membership-application" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-[#006B3B] hover:bg-[#EFF8F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#006B3B]">{t("becomeMember")}</Link>
            <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white px-4 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#006B3B]">{t("contactUs")}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
