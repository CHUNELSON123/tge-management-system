"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Globe, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { publicBusinessesService, PublicBusinessNotFoundError, type PublicBusinessDetails } from "../services/public-businesses.service";
import messages from "../business-messages.json";

export default function BusinessDetailsPage({ slug }: { slug: string }) {
  const { locale } = useLanguage();
  const t = locale === "fr" ? messages.fr : messages.en;
  const [business, setBusiness] = useState<PublicBusinessDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    publicBusinessesService.getBusiness(slug, controller.signal).then(setBusiness).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof PublicBusinessNotFoundError) setNotFound(true); else setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug]);

  return <main className="mx-auto min-h-[60vh] max-w-[1280px] px-5 py-6 text-[#151A18] sm:px-8 lg:px-10">
    <nav aria-label={locale === "fr" ? "Fil d’Ariane" : "Breadcrumb"} className="mb-5 flex flex-wrap items-center gap-2 text-xs text-[#59675E]"><Link href="/">{locale === "fr" ? "Accueil" : "Home"}</Link><span>›</span><Link href="/business-directory">{t.businessDirectoryEyebrow}</Link>{business && <><span>›</span><span aria-current="page">{business.name}</span></>}</nav>
    {loading ? <p role="status" className="py-20 text-center text-sm text-[#56615B]">{t.businessDetailsLoading}</p> : notFound ? <div className="mx-auto max-w-xl py-16 text-center"><h1 className="text-3xl font-bold">{t.businessNotFoundTitle}</h1><p className="mt-3 text-sm leading-6 text-[#56615B]">{t.businessNotFoundCopy}</p><Link href="/business-directory" className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-md bg-[#006B3B] px-4 text-sm font-semibold text-white"><ArrowLeft aria-hidden="true" size={16}/>{t.backToBusinessDirectory}</Link></div> : failed || !business ? <p role="alert" className="my-10 rounded-lg bg-red-50 p-5 text-sm text-red-800">{t.businessDetailsError}</p> : <>
      <section className="relative overflow-hidden rounded-xl bg-[#07341F] text-white"><div className="absolute inset-0 bg-[url('/public-pages/business-profile-design-banner.webp')] bg-cover bg-center" role="img" aria-label={t.businessDirectoryHeroImage}/><div className="absolute inset-0 bg-gradient-to-r from-[#052719]/80 via-[#052719]/20 to-transparent" aria-hidden="true"/><div className="relative flex min-h-40 items-center px-6 py-8 sm:px-10"><h1 className="max-w-xl text-2xl font-bold leading-tight sm:text-3xl">{business.name}</h1></div></section>
      <section className="-mt-5 relative grid gap-6 rounded-xl bg-white p-5 shadow-[0_3px_18px_#10251a12] sm:grid-cols-[1fr_auto] sm:p-7">
        <div><div className="flex flex-wrap items-center gap-3"><span className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#E5EBE7] bg-[#F0F6F2] text-[#087B49]"><Building2 aria-hidden="true" size={34}/></span><div><p className="text-xs font-bold uppercase tracking-wide text-[#087B49]">{business.categories.map((category) => category.name).join(" · ")}</p><h2 className="mt-1 text-2xl font-bold">{business.name}</h2></div></div><p className="mt-4 max-w-3xl text-sm leading-6 text-[#56615B]">{business.description || t.businessDescriptionUnavailable}</p>{business.address && <p className="mt-3 flex items-center gap-2 text-sm text-[#56615B]"><MapPin aria-hidden="true" size={17} className="text-[#087B49]"/>{business.address}</p>}</div>
        <div className="flex flex-col gap-2 sm:min-w-56 sm:justify-center">{business.email && <a href={`mailto:${business.email}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32]"><Mail aria-hidden="true" size={16}/>{t.contactBusiness}</a>}{business.phone && <a href={`tel:${business.phone.replace(/[^+\d]/g, "")}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#087B49] px-4 text-sm font-semibold text-[#087B49]"><Phone aria-hidden="true" size={16}/>{business.phone}</a>}{business.websiteUrl && <a href={business.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#087B49] px-4 text-sm font-semibold text-[#087B49]"><Globe aria-hidden="true" size={16}/>{t.visitBusinessWebsite}<span className="sr-only"> ({locale === "fr" ? "s’ouvre dans un nouvel onglet" : "opens in a new tab"})</span></a>}</div>
      </section>
      <section className="mt-7 grid gap-5 md:grid-cols-2"><article className="rounded-xl border border-[#E5EBE7] p-5"><h2 className="text-lg font-bold">{t.businessOverview}</h2><p className="mt-3 text-sm leading-6 text-[#56615B]">{business.description || t.businessDescriptionUnavailable}</p></article><aside className="rounded-xl border border-[#E5EBE7] bg-[#F7FAF8] p-5"><h2 className="text-lg font-bold">{t.businessInformation}</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="font-semibold">{t.businessNameLabel}</dt><dd className="text-[#56615B]">{business.name}</dd></div>{business.address && <div><dt className="font-semibold">{t.businessLocationLabel}</dt><dd className="text-[#56615B]">{business.address}</dd></div>}{business.websiteUrl && <div><dt className="font-semibold">{t.businessWebsiteLabel}</dt><dd><a className="break-all text-[#087B49] underline" href={business.websiteUrl} target="_blank" rel="noopener noreferrer">{business.websiteUrl}</a></dd></div>}{business.email && <div><dt className="font-semibold">{t.businessEmailLabel}</dt><dd><a className="text-[#087B49] underline" href={`mailto:${business.email}`}>{business.email}</a></dd></div>}{business.phone && <div><dt className="font-semibold">{t.businessPhoneLabel}</dt><dd><a className="text-[#087B49] underline" href={`tel:${business.phone.replace(/[^+\d]/g, "")}`}>{business.phone}</a></dd></div>}</dl></aside></section>
      <Link href="/business-directory" className="mt-7 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#087B49] hover:underline"><ArrowLeft aria-hidden="true" size={16}/>{t.backToBusinessDirectory}</Link>
    </>}
  </main>;
}
