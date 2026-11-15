"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, ChevronRight, GraduationCap, Search } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useMemberProgrammes } from "../hooks/use-member-programmes";
import type { MemberProgrammeView } from "../types/member-programmes.types";

const tabs: Array<{ id: MemberProgrammeView; key: "memberTabEnrolled" | "memberTabCompleted" | "memberTabAvailable"; count: "enrolled" | "completed" | "available" }> = [
  { id: "enrolled", key: "memberTabEnrolled", count: "enrolled" },
  { id: "completed", key: "memberTabCompleted", count: "completed" },
  { id: "available", key: "memberTabAvailable", count: "available" },
];

function formatDate(value: string | null, locale: string) {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function MemberProgrammesPage() {
  const { locale, t } = useLanguage();
  const programmes = useMemberProgrammes();
  return <section aria-labelledby="member-programmes-title" aria-busy={programmes.loading}>
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><h1 id="member-programmes-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{t("memberProgrammesTitle")}</h1><p className="mt-1 text-sm text-[#59645D]">{t("memberProgrammesDescription")}</p></div>
      <Link href="/programmes" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2"><BookOpen aria-hidden="true" size={17} />{t("programmes")}</Link>
    </header>

    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div role="tablist" aria-label={t("memberProgrammesTitle")} className="flex min-w-0 overflow-x-auto border-b border-[#E4EAE6]">
        {tabs.map(({ id, key, count }) => <button key={id} type="button" role="tab" aria-selected={programmes.view === id} onClick={() => programmes.setView(id)} className={`min-h-11 shrink-0 border-b-2 px-3 text-xs font-semibold sm:px-4 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#147E4A] ${programmes.view === id ? "border-[#087340] text-[#075C32]" : "border-transparent text-[#39443D] hover:text-[#075C32]"}`}>{t(key)}<span className="ml-2 rounded-full bg-[#F0F4F1] px-2 py-0.5 text-[10px]">{programmes.counts[count]}</span></button>)}
      </div>
      <label className="relative block w-full sm:max-w-xs"><span className="sr-only">{t("memberProgrammeSearch")}</span><Search aria-hidden="true" size={17} className="absolute left-3 top-3 text-[#738078]" /><input type="search" value={programmes.search} onChange={(event) => programmes.setSearch(event.target.value)} placeholder={t("memberProgrammeSearch")} className="min-h-10 w-full rounded-md border border-[#D8E0DB] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#087340] focus:ring-2 focus:ring-[#087340]/20" /></label>
    </div>

    {programmes.loading && <div className="mt-5 space-y-3" aria-label={t("loading")}>{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-[#F1F5F2]" />)}</div>}
    {programmes.failed && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900" role="alert"><p>{t("memberProgrammeError")}</p><button type="button" onClick={programmes.retry} className="mt-3 rounded-md bg-[#006B3B] px-4 py-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{t("retry")}</button></div>}

    {!programmes.loading && !programmes.failed && (programmes.programmes.length === 0 ? <p className="mt-5 rounded-xl border border-[#E6ECE8] bg-white px-4 py-12 text-center text-sm text-[#68736C]">{programmes.emptyMessage}</p> : <ul className="mt-4 space-y-3">
      {programmes.programmes.map((programme) => <li key={programme.id}>
        <article className="grid gap-4 rounded-xl border border-[#E6ECE8] bg-white p-4 shadow-[0_2px_10px_#111B1608] sm:grid-cols-[auto_minmax(0,1fr)_minmax(170px,0.8fr)_auto] sm:items-center sm:p-5">
          <span aria-hidden="true" className={`grid h-16 w-16 place-items-center rounded-full ${programme.enrollmentStatus === "completed" ? "bg-[#F5F1F8] text-[#6741A2]" : programme.enrollmentStatus === null ? "bg-[#FCF7EA] text-[#A96F00]" : "bg-[#EAF3ED] text-[#087340]"}`}><GraduationCap size={29} /></span>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-bold text-[#17211B]">{programme.name}</h2><span className="rounded-md bg-[#EEF5F0] px-2 py-1 text-[11px] font-semibold text-[#075C32]">{t(programme.enrollmentStatus === "completed" ? "memberProgrammeCompleted" : programme.enrollmentStatus === "enrolled" ? "memberProgrammeActive" : "memberProgrammePublished")}</span></div>
            {programme.description && <p className="mt-1 line-clamp-2 text-sm text-[#59645D]">{programme.description}</p>}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#59645D]">{programme.cohortName && <span>{t("memberProgrammeCohort")}: {programme.cohortName}</span>}{programme.enrolledAt && <time dateTime={programme.enrolledAt}>{t("memberProgrammeStartDate")}: {formatDate(programme.enrolledAt, locale)}</time>}{programme.startDate && !programme.enrolledAt && <time dateTime={programme.startDate}>{t("memberProgrammeStartDate")}: {formatDate(programme.startDate, locale)}</time>}{programme.endDate && <time dateTime={programme.endDate}>{t("memberProgrammeEndDate")}: {formatDate(programme.endDate, locale)}</time>}</div>
          </div>
          <div className="min-w-0 rounded-lg bg-[#F7F9F7] p-3"><div className="flex items-center justify-between text-xs font-semibold text-[#39443D]"><span>{t("memberProgrammeProgress")}</span><span aria-hidden="true">—</span></div><div className="mt-2 h-1.5 rounded-full bg-[#E1E5E2]" aria-hidden="true" /><p className="mt-2 flex items-center gap-1 text-xs text-[#68736C]"><CalendarDays aria-hidden="true" size={14} />{t("memberProgrammeNextLesson")}</p></div>
          <div className="flex items-center justify-end sm:block">{programme.enrollmentStatus ? <button type="button" disabled aria-describedby={`programme-unavailable-${programme.id}`} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#C8D8CC] px-3 text-xs font-semibold text-[#68736C] disabled:cursor-not-allowed sm:w-auto">{t("memberProgrammeContinue")}<ChevronRight aria-hidden="true" size={15} /></button> : <Link href="/programmes" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#087340] px-3 text-xs font-semibold text-[#075C32] hover:bg-[#F2F8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] sm:w-auto">{t("memberProgrammeDetails")}<ChevronRight aria-hidden="true" size={15} /></Link>}<span id={`programme-unavailable-${programme.id}`} className="sr-only">{t("memberProgrammeProgress")}</span></div>
        </article>
      </li>)}
    </ul>)}
  </section>;
}
