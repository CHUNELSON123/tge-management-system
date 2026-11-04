"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, MapPin, Search } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import type { FormEvent } from "react";
import { publicBusinessesService, type PublicBusiness, type PublicBusinessCategoryCount, type PublicBusinessList } from "../services/public-businesses.service";
import messages from "../business-messages.json";

export default function BusinessDirectoryPage() {
  const { locale } = useLanguage();
  const t = locale === "fr" ? messages.fr : messages.en;
  const [businesses, setBusinesses] = useState<PublicBusinessList | null>(null);
  const [categories, setCategories] = useState<PublicBusinessCategoryCount[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [categoriesFailed, setCategoriesFailed] = useState(false);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true); setFailed(false);
    publicBusinessesService.getBusinesses({ q: search, categoryId: categoryId || undefined, page }, signal)
      .then(setBusinesses).catch(() => { if (!signal?.aborted) setFailed(true); })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, [search, categoryId, page]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    const controller = new AbortController();
    publicBusinessesService.getCategories(controller.signal).then(setCategories).catch(() => { if (!controller.signal.aborted) setCategoriesFailed(true); });
    return () => controller.abort();
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setSearch(query.trim()); }
  function chooseCategory(id: string) { setPage(1); setCategoryId(id); }

  return <main className="bg-white text-[#151A18]">
    <section className="relative overflow-hidden bg-[#F0F6F2]">
      <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-[url('/public-pages/business-directory-design-photo.webp')] bg-cover bg-center lg:block" role="img" aria-label={t.businessDirectoryHeroImage}><div className="absolute inset-0 bg-gradient-to-r from-[#F0F6F2] via-[#F0F6F2]/20 to-transparent" /></div>
      <div className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-10 sm:px-8 lg:min-h-[290px] lg:grid-cols-[1fr_0.9fr] lg:px-10">
        <div className="relative z-10">
          <nav aria-label={locale === "fr" ? "Fil d’Ariane" : "Breadcrumb"} className="mb-5 flex gap-2 text-xs text-[#53625A]"><Link href="/">{locale === "fr" ? "Accueil" : "Home"}</Link><span>›</span><span aria-current="page">{t.businessDirectoryEyebrow}</span></nav>
          <p className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{t.businessDirectoryEyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{t.businessDirectoryHeadlineFirst}<span className="block text-[#075C32]">{t.businessDirectoryHeadlineSecond}</span></h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#4D5B52]">{t.businessDirectoryIntro}</p>
          <form onSubmit={submitSearch} className="mt-5 flex max-w-[560px] overflow-hidden rounded-md border border-[#DDE6E0] bg-white focus-within:ring-2 focus-within:ring-[#147E4A]">
            <label htmlFor="business-search" className="sr-only">{t.businessSearchLabel}</label>
            <input id="business-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.businessSearchPlaceholder} className="min-w-0 flex-1 px-3 py-3 text-sm outline-none" />
            <button type="submit" aria-label={t.businessSearchButton} className="flex w-12 items-center justify-center bg-[#006B3B] text-white hover:bg-[#075C32]"><Search aria-hidden="true" size={18}/></button>
          </form>
          <div className="mt-4 flex flex-wrap gap-3"><a href="#business-results" className="inline-flex min-h-10 items-center rounded-md bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32]">{t.browseAllBusinesses}</a><Link href="/login" className="inline-flex min-h-10 items-center rounded-md border border-[#087B49] px-4 text-sm font-semibold text-[#087B49] hover:bg-white">{t.listYourBusiness}</Link></div>
        </div>
      </div>
      <div className="h-40 bg-[url('/public-pages/business-directory-design-photo.webp')] bg-cover bg-center lg:hidden" role="img" aria-label={t.businessDirectoryHeroImage} />
    </section>

    <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10" aria-labelledby="business-category-heading">
      <div className="flex items-center justify-between gap-4"><h2 id="business-category-heading" className="text-lg font-bold">{t.browseByCategory}</h2>{categoriesFailed && <span className="text-xs text-[#9B352B]" role="status">{t.businessCategoriesError}</span>}</div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => chooseCategory("")} aria-pressed={!categoryId} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${!categoryId ? "border-[#087B49] bg-[#EAF4ED] font-semibold text-[#075C32]" : "border-[#E0E7E2] bg-white"}`}>{t.allBusinessCategories}</button>
        {categories.map((category) => <button key={category.id} onClick={() => chooseCategory(category.id)} aria-pressed={categoryId === category.id} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${categoryId === category.id ? "border-[#087B49] bg-[#EAF4ED] font-semibold text-[#075C32]" : "border-[#E0E7E2] bg-white"}`}>{category.name} <span className="text-xs text-[#66736A]">{category.count}</span></button>)}
      </div>
    </section>

    <section id="business-results" aria-labelledby="businesses-heading" className="mx-auto max-w-[1440px] px-5 pb-9 sm:px-8 lg:px-10">
      <h2 id="businesses-heading" className="text-xl font-bold">{t.businessesHeading}</h2>
      {loading ? <p role="status" className="py-14 text-center text-sm text-[#56615B]">{t.businessesLoading}</p> : failed ? <p role="alert" className="my-5 rounded-lg bg-red-50 p-5 text-sm text-red-800">{t.businessesError}</p> : !businesses?.items.length ? <p role="status" className="mt-5 rounded-lg bg-[#F4F8F5] p-8 text-center text-sm text-[#56615B]">{search || categoryId ? t.businessesNoResults : t.businessesEmpty}</p> : <>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{businesses.items.map((business) => <BusinessCard key={business.id} business={business} t={t}/>)}</div>
        {businesses.totalPages > 1 && <nav aria-label={t.businessesPagination} className="mt-7 flex items-center justify-center gap-4"><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-10 rounded-md border border-[#087B49] px-4 text-sm font-semibold text-[#087B49] disabled:opacity-40">{t.previousBusinessPage}</button><span aria-live="polite" className="text-sm">{t.businessPageLabel} {businesses.page} {t.businessPageOf} {businesses.totalPages}</span><button disabled={page >= businesses.totalPages} onClick={() => setPage((value) => Math.min(businesses.totalPages, value + 1))} className="min-h-10 rounded-md border border-[#087B49] px-4 text-sm font-semibold text-[#087B49] disabled:opacity-40">{t.nextBusinessPage}</button></nav>}
      </>}
    </section>
    <section className="mx-auto mb-10 max-w-[1360px] rounded-xl bg-[#075C32] px-6 py-7 text-white sm:mx-8 sm:flex sm:items-center sm:justify-between lg:mx-auto lg:px-10"><div><h2 className="text-lg font-bold">{t.businessMemberCtaTitle}</h2><p className="mt-1 text-sm text-white/85">{t.businessMemberCtaCopy}</p></div><Link href="/login" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-[#075C32] sm:mt-0">{t.listYourBusiness}<ArrowRight aria-hidden="true" size={16}/></Link></section>
  </main>;
}

function BusinessCard({ business, t }: { business: PublicBusiness; t: typeof messages.en | typeof messages.fr }) {
  return <article className="flex flex-col overflow-hidden rounded-xl border border-[#E5EBE7] bg-white shadow-[0_3px_15px_#10251a0b]">
    <div className="flex h-32 items-center justify-center bg-[linear-gradient(135deg,#E6F1E9,#BFD8C5)] text-[#087B49]"><Building2 aria-hidden="true" size={44}/></div>
    <div className="flex flex-1 flex-col p-4"><h3 className="text-base font-bold">{business.name}</h3><p className="mt-1 text-xs font-medium text-[#087B49]">{business.categories.map((category) => category.name).join(" · ")}</p><p className="mt-2 line-clamp-3 flex-1 text-sm leading-5 text-[#56615B]">{business.description || t.businessDescriptionUnavailable}</p>{business.address && <p className="mt-3 flex items-start gap-1.5 text-xs text-[#56615B]"><MapPin aria-hidden="true" size={14} className="mt-0.5 shrink-0 text-[#087B49]"/>{business.address}</p>}<Link href={`/business-directory/${encodeURIComponent(business.slug)}`} className="mt-4 inline-flex min-h-9 w-fit items-center gap-2 rounded-md border border-[#087B49] px-3 text-xs font-semibold text-[#087B49] hover:bg-[#F2F8F4]">{t.viewBusiness}<ArrowRight aria-hidden="true" size={14}/></Link></div>
  </article>;
}
