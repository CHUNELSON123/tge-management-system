"use client";

import Link from "next/link";
import { BriefcaseBusiness, Building2, ClipboardCheck, Clock3, ExternalLink, Lightbulb, Plus, TrendingUp, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useMemberBusinesses } from "../hooks/use-member-businesses";

export function MemberBusinessesPage() {
  const { locale, t } = useLanguage();
  const { data, loading, failed, retry } = useMemberBusinesses();
  const isFrench = locale === "fr";
  const text = isFrench ? {
    title: "Mes entreprises", intro: "Gérez les profils de vos entreprises et consultez leur statut.", add: "Ajouter une entreprise", active: "Entreprises actives", total: "Toutes les entreprises", publishedCount: "Profils publiés", draftCount: "Profils brouillons", profiles: "Mes profils d’entreprise", empty: "Aucune entreprise n’est associée à votre compte.", error: "Les entreprises sont temporairement indisponibles.", retry: "Réessayer", activeStatus: "Actif", inactiveStatus: "Inactif", published: "Publié", approved: "Approuvé, non publié", draft: "Brouillon", edit: "Modifier le profil", view: "Voir le profil", unavailable: "Les actions de création et de modification ne sont pas encore disponibles.", tipTitle: "Conseils pour votre entreprise", tip: "Complétez votre profil d’entreprise pour améliorer sa visibilité et attirer des partenaires et des clients.", opportunities: "Opportunités", opportunitiesUnavailable: "Les opportunités ne sont pas encore disponibles sur cette page.", viewAll: "Voir toutes les opportunités", addAnother: "Vous souhaitez ajouter une autre entreprise ?", addAnotherCopy: "Gérez vos profils d’entreprise depuis votre compte membre.", status: "Statut",
  } : {
    title: "My Businesses", intro: "Manage your business profiles, track their status, and access supported profile actions.", add: "Add New Business", active: "Active Businesses", total: "Total Businesses", publishedCount: "Published Profiles", draftCount: "Draft Profiles", profiles: "My Business Profiles", empty: "No businesses are associated with your account.", error: "Businesses are temporarily unavailable.", retry: "Retry", activeStatus: "Active", inactiveStatus: "Inactive", published: "Published", approved: "Approved, not published", draft: "Draft", edit: "Edit Profile", view: "View Profile", unavailable: "Business creation and editing are not available yet.", tipTitle: "Business Tips", tip: "Complete your business profile to get more visibility and attract potential partners and customers.", opportunities: "Opportunities", opportunitiesUnavailable: "Opportunity listings are not available on this page yet.", viewAll: "View all opportunities", addAnother: "Looking to add another business?", addAnotherCopy: "You can manage your business profiles from your member account.",
  };
  const businesses = data ?? [];
  const activeCount = businesses.filter((business) => business.status.toLowerCase() === "active").length;
  const publishedCount = businesses.filter((business) => business.status.toLowerCase() === "active" && business.publicationStatus.toLowerCase() === "approved").length;
  const draftCount = businesses.filter((business) => business.publicationStatus.toLowerCase() === "draft").length;
  const statusText = (business: { status: string; publicationStatus: string }) => {
    const activityStatus = business.status.toLowerCase();
    const publicationStatus = business.publicationStatus.toLowerCase();
    const readable = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
    const activity = activityStatus === "active" ? text.activeStatus : activityStatus === "inactive" ? text.inactiveStatus : readable(business.status);
    const publication = publicationStatus === "approved" ? activityStatus === "active" ? text.published : text.approved : publicationStatus === "draft" ? text.draft : readable(business.publicationStatus);
    return { activity, publication };
  };

  return <section aria-labelledby="member-businesses-title" className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 id="member-businesses-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{text.title}</h1><p className="mt-2 text-sm text-[#59645D]">{text.intro}</p></div><button type="button" disabled title={text.unavailable} className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-lg bg-[#006B3B] px-4 text-sm font-semibold text-white opacity-60"><Plus size={18}/>{text.add}</button></header>
    {loading ? <p role="status" className="rounded-xl border p-6 text-sm text-[#53645A]">{t("loading")}</p> : failed || !data ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{text.error}<button onClick={retry} className="ml-3 font-semibold underline">{text.retry}</button></div> : <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard icon={BriefcaseBusiness} label={text.active} value={activeCount} color="green"/>
        <MetricCard icon={Building2} label={text.total} value={businesses.length} color="blue"/>
        <MetricCard icon={ClipboardCheck} label={text.publishedCount} value={publishedCount} color="purple"/>
        <MetricCard icon={Clock3} label={text.draftCount} value={draftCount} color="amber"/>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="member-business-profiles"><h2 id="member-business-profiles" className="mb-4 font-bold text-[#17211B]">{text.profiles}</h2>
          {businesses.length ? <ul className="divide-y divide-[#E9EEEB]">{businesses.map((business) => { const status = statusText(business); const isPublic = business.status.toLowerCase() === "active" && business.publicationStatus.toLowerCase() === "approved"; return <li key={business.id} className="py-4 first:pt-0 last:pb-0"><article className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 sm:grid-cols-[96px_minmax(0,1fr)_140px] sm:items-center sm:gap-4"><span className="grid h-[72px] w-[72px] place-items-center rounded-xl bg-[#EFF7F1] text-[#087443] sm:h-24 sm:w-24"><BriefcaseBusiness size={32} aria-hidden="true"/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#17211B]">{business.name}</h3><span className={`rounded-md px-2 py-1 text-xs font-semibold ${business.status.toLowerCase() === "active" ? "bg-[#E7F5EC] text-[#087443]" : "bg-[#F1F2F2] text-[#59645D]"}`}>{status.activity}</span></div><p className="mt-1 text-sm text-[#59645D]">{status.publication}</p>{business.description && <p className="mt-2 line-clamp-2 text-sm text-[#59645D]">{business.description}</p>}{business.categories.length > 0 && <ul className="mt-2 flex flex-wrap gap-2">{business.categories.map((category) => <li key={category} className="rounded-md bg-[#F1F3F2] px-2 py-1 text-xs text-[#39443D]">{category}</li>)}</ul>}</div><div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:grid-cols-1"><button type="button" disabled title={text.unavailable} className="min-h-9 cursor-not-allowed rounded-lg border border-[#0A7A43] px-3 text-sm font-semibold text-[#087443] opacity-60">{text.edit}</button>{isPublic ? <Link href={`/business-directory/${business.slug}`} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-[#006B3B] px-3 text-sm font-semibold text-white">{text.view}<ExternalLink size={14}/></Link> : <button type="button" disabled title={status.publication} className="min-h-9 cursor-not-allowed rounded-lg bg-[#006B3B] px-3 text-sm font-semibold text-white opacity-50">{text.view}</button>}</div></article></li>; })}</ul> : <p className="rounded-lg border border-dashed border-[#CBD8CE] p-5 text-sm text-[#59645D]">{text.empty}</p>}
        </section>
        <aside className="hidden space-y-4 xl:block"><section className="rounded-xl border border-[#E6ECE8] p-4"><h2 className="flex items-center gap-2 font-bold"><Lightbulb size={19} className="text-[#087443]" aria-hidden="true"/>{text.tipTitle}</h2><p className="mt-3 text-sm leading-5 text-[#59645D]">{text.tip}</p></section><section className="rounded-xl border border-[#E6ECE8] p-4"><h2 className="flex items-center gap-2 font-bold"><BriefcaseBusiness size={18} className="text-[#087443]" aria-hidden="true"/>{text.opportunities}</h2><p className="mt-3 text-sm leading-5 text-[#59645D]">{text.opportunitiesUnavailable}</p><button type="button" disabled className="mt-3 text-sm font-semibold text-[#087443] opacity-50">{text.viewAll} →</button></section></aside>
      </div>
      <aside className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F1F8F3] p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#087443]"><TrendingUp size={20}/></span><div><h2 className="font-bold">{text.addAnother}</h2><p className="mt-1 text-sm text-[#59645D]">{text.addAnotherCopy}</p></div></div><button type="button" disabled title={text.unavailable} className="min-h-10 cursor-not-allowed rounded-lg border border-[#0A7A43] px-4 text-sm font-semibold text-[#087443] opacity-60">{text.add}</button></aside>
    </>}
  </section>;
}

function MetricCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: number; color: "green" | "blue" | "purple" | "amber" }) {
  const colors = {
    green: "bg-[#F1F8F3] text-[#087443]",
    blue: "bg-[#EFF6FC] text-[#1877C9]",
    purple: "bg-[#F6F0FA] text-[#8550AE]",
    amber: "bg-[#FFF7E8] text-[#C57A00]",
  };
  return <article className={`flex min-h-[88px] items-center gap-3 rounded-xl border border-white p-3 sm:p-4 ${colors[color]}`}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/70"><Icon size={21} aria-hidden="true"/></span><div className="min-w-0"><p className="text-[11px] font-semibold leading-4 text-[#59645D] sm:text-xs">{label}</p><p className="mt-1 text-2xl font-bold leading-none text-[#111B16]">{value}</p></div></article>;
}
