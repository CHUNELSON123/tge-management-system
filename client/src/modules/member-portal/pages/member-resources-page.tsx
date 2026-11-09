"use client";

import { useMemo, useState } from "react";
import { BookOpen, FileText, GraduationCap, Layers3, Search, Sprout, Star } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useMemberResources } from "../hooks/use-member-resources";
import { downloadMemberResource, MemberResourceFileError, previewMemberResource } from "../services/member-resources.service";
import type { MemberResource } from "../types/member-resources.types";

type ResourceTab = "all" | "training" | "documents";

export function MemberResourcesPage() {
  const { locale, t } = useLanguage();
  const isFrench = locale === "fr";
  const { data, loading, failed, retry } = useMemberResources();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [tab, setTab] = useState<ResourceTab>("all");
  const [sort, setSort] = useState("recent");
  const [pendingResourceId, setPendingResourceId] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const resources = useMemo(() => data ?? [], [data]);
  const categories = useMemo(() => [...new Set(resources.map((resource) => resource.category))].sort(), [resources]);
  const types = useMemo(() => [...new Set(resources.map((resource) => resource.resourceType))].sort(), [resources]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return resources.filter((resource) => matchesResourceTab(resource, tab) && (!category || resource.category === category) && (!resourceType || resource.resourceType === resourceType) &&
      (!query || `${resource.title} ${resource.description ?? ""} ${resource.category} ${resource.resourceType}`.toLocaleLowerCase().includes(query)))
      .sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "old" ? (a.publishedAt ?? "").localeCompare(b.publishedAt ?? "") : (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  }, [resources, tab, category, resourceType, search, sort]);
  const newest = useMemo(() => [...resources].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0] ?? null, [resources]);
  const recentlyAdded = useMemo(() => [...resources].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")).filter((resource) => resource.id !== newest?.id).slice(0, 3), [resources, newest]);
  const text = isFrench ? {
    title: "Ressources", intro: "Accédez aux ressources de formation et aux documents organisationnels pour soutenir votre parcours entrepreneurial.", allResources: "Toutes les ressources", training: "Ressources de formation", documents: "Documents organisationnels", search: "Rechercher des ressources…", allCategories: "Toutes les catégories", allTypes: "Tous les types", showing: "Affichage", of: "sur", sortBy: "Trier par :", recent: "Plus récentes", oldest: "Plus anciennes", alphabetical: "Titre", featured: "Ressource en vedette", recentlyAdded: "Récemment ajoutées", viewAll: "Voir toutes les ressources", view: "Voir", download: "Télécharger", previewUnsupported: "Aperçu non pris en charge pour ce format.", noFile: "Aucun fichier n’est associé à cette ressource.", fileUnavailable: "L’accès sécurisé au fichier est temporairement indisponible.", empty: "Aucune ressource publiée n’est actuellement disponible pour votre compte.", noMatch: "Aucune ressource ne correspond à vos filtres.", error: "Impossible de charger les ressources.", retry: "Réessayer", suggestTitle: "Besoin d’une ressource précise ?", suggestCopy: "Dites-nous quelles ressources vous aideraient.", suggest: "Suggérer une ressource", suggestUnavailable: "Les suggestions ne peuvent pas être envoyées pour le moment.",
  } : {
    title: "Resources", intro: "Access training materials and organizational documents to support your entrepreneurial journey.", allResources: "All Resources", training: "Training Resources", documents: "Organisational Documents", search: "Search resources…", allCategories: "All Categories", allTypes: "All Resource Types", showing: "Showing", of: "of", sortBy: "Sort by:", recent: "Most Recent", oldest: "Oldest", alphabetical: "Title", featured: "Featured Resource", recentlyAdded: "Recently Added", viewAll: "View All Resources", view: "View", download: "Download", previewUnsupported: "Preview is not supported for this file type.", noFile: "No file is attached to this resource.", fileUnavailable: "Secure file access is temporarily unavailable.", empty: "No published resources are currently available to your account.", noMatch: "No resources match your filters.", error: "We could not load the resources.", retry: "Retry", suggestTitle: "Need a specific resource?", suggestCopy: "Tell us which resources would help you.", suggest: "Suggest a Resource", suggestUnavailable: "Resource suggestions cannot be sent right now.",
  };
  const inlineTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain"]);
  const fileType = (resource: MemberResource) => resource.mimeType?.split("/").pop()?.toUpperCase() ?? resource.resourceType.toUpperCase();
  const fileSize = (bytes: number) => bytes < 1_048_576 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1_048_576).toFixed(1)} MB`;
  const actionError = (error: unknown) => error instanceof MemberResourceFileError && error.status === 415 ? text.previewUnsupported : text.fileUnavailable;

  async function handlePreview(resource: MemberResource) {
    setFileError(""); setPendingResourceId(resource.id);
    try { await previewMemberResource(resource.id); }
    catch (error) { setFileError(actionError(error)); }
    finally { setPendingResourceId(null); }
  }
  async function handleDownload(resource: MemberResource) {
    setFileError(""); setPendingResourceId(resource.id);
    try { await downloadMemberResource(resource.id); }
    catch (error) { setFileError(actionError(error)); }
    finally { setPendingResourceId(null); }
  }
  function viewAllResources() { setTab("all"); setCategory(""); setResourceType(""); setSearch(""); setSort("recent"); }

  return <section aria-labelledby="member-resources-title" className="space-y-4">
    {loading ? <><header><h1 id="member-resources-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{text.title}</h1><p className="mt-1 max-w-3xl text-sm text-[#59645D]">{text.intro}</p></header><p role="status" className="rounded-xl border p-6 text-sm text-[#53645A]">{t("loading")}</p></> : failed ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{text.error}<button onClick={retry} className="ml-3 font-semibold underline">{text.retry}</button></div> : resources.length === 0 ? <><header><h1 id="member-resources-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{text.title}</h1><p className="mt-1 max-w-3xl text-sm text-[#59645D]">{text.intro}</p></header><p className="rounded-xl border border-dashed border-[#CBD8CE] p-6 text-sm text-[#59645D]">{text.empty}</p></> : <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
      <div className="min-w-0 space-y-4">
        <header><h1 id="member-resources-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{text.title}</h1><p className="mt-1 max-w-3xl text-sm text-[#59645D]">{text.intro}</p></header>
        <div role="tablist" aria-label={text.title} className="grid grid-cols-3 overflow-hidden rounded-lg border border-[#CAD7CE]">
          <ResourceTabButton selected={tab === "all"} onClick={() => setTab("all")} icon={Layers3}>{text.allResources}</ResourceTabButton>
          <ResourceTabButton selected={tab === "training"} onClick={() => setTab("training")} icon={GraduationCap}>{text.training}</ResourceTabButton>
          <ResourceTabButton selected={tab === "documents"} onClick={() => setTab("documents")} icon={FileText}>{text.documents}</ResourceTabButton>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)_minmax(0,.7fr)]">
          <label className="flex items-center gap-2 rounded-lg border border-[#D9E2DC] px-3"><Search size={18} aria-hidden="true" className="text-[#65746A]"/><span className="sr-only">{text.search}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} className="min-h-11 w-full bg-transparent text-sm outline-none"/></label>
          <select aria-label={text.allCategories} value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 min-w-0 rounded-lg border border-[#D9E2DC] bg-white px-3 text-sm"><option value="">{text.allCategories}</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <select aria-label={text.allTypes} value={resourceType} onChange={(event) => setResourceType(event.target.value)} className="min-h-11 min-w-0 rounded-lg border border-[#D9E2DC] bg-white px-3 text-sm"><option value="">{text.allTypes}</option>{types.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#59645D]"><span>{text.showing} {filtered.length} {text.of} {resources.length} {isFrench ? "ressources" : "resources"}</span><label className="flex items-center gap-2">{text.sortBy}<select value={sort} onChange={(event) => setSort(event.target.value)} className="min-h-10 rounded-lg border border-[#D9E2DC] bg-white px-3"><option value="recent">{text.recent}</option><option value="old">{text.oldest}</option><option value="title">{text.alphabetical}</option></select></label></div>
        {fileError && <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{fileError}</p>}
        {filtered.length ? <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{filtered.map((resource) => <ResourceCard key={resource.id} resource={resource} viewLabel={text.view} downloadLabel={text.download} previewUnsupported={text.previewUnsupported} noFile={text.noFile} pending={pendingResourceId === resource.id} inlineSupported={inlineTypes.has(resource.mimeType?.toLowerCase() ?? "")} onPreview={() => void handlePreview(resource)} onDownload={() => void handleDownload(resource)} formatType={fileType} formatSize={fileSize}/>)}</div> : <p className="rounded-xl border border-dashed border-[#CBD8CE] p-6 text-sm text-[#59645D]">{text.noMatch}</p>}
      </div>
      <aside className="space-y-3 xl:pt-0">
        {newest && <section className="rounded-xl border border-[#E6ECE8] p-3"><h2 className="flex items-center gap-2 px-1 font-bold text-[#17211B]"><Star aria-hidden="true" size={16} className="text-amber-500"/>{text.featured}</h2><div className="mt-3 grid min-h-24 place-items-center rounded-lg bg-gradient-to-br from-[#064D2D] via-[#0B7041] to-[#A0C78C] p-4 text-center text-white"><Sprout size={28} aria-hidden="true"/><span className="mt-1 line-clamp-2 text-lg font-bold">{newest.title}</span></div><h3 className="mt-3 font-bold text-[#17211B]">{newest.title}</h3>{newest.description && <p className="mt-1 line-clamp-3 text-sm leading-5 text-[#59645D]">{newest.description}</p>}<p className="mt-3 text-xs text-[#59645D]">{fileType(newest)}{newest.fileSize !== null ? ` · ${fileSize(newest.fileSize)}` : ""}{newest.version !== null ? ` · v${newest.version}` : ""}</p><ResourceActions resource={newest} viewLabel={text.view} downloadLabel={text.download} previewUnsupported={text.previewUnsupported} noFile={text.noFile} pending={pendingResourceId === newest.id} inlineSupported={inlineTypes.has(newest.mimeType?.toLowerCase() ?? "")} onPreview={() => void handlePreview(newest)} onDownload={() => void handleDownload(newest)}/></section>}
        {recentlyAdded.length > 0 && <section className="rounded-xl border border-[#E6ECE8] p-3"><h2 className="px-1 font-bold text-[#17211B]">{text.recentlyAdded}</h2><ul className="mt-2 divide-y divide-[#EDF0EE]">{recentlyAdded.map((resource) => <li key={resource.id} className="py-2.5"><p className="text-sm font-semibold text-[#17211B]">{resource.title}</p><p className="mt-1 text-xs text-[#59645D]">{fileType(resource)}{resource.fileSize !== null ? ` · ${fileSize(resource.fileSize)}` : ""}</p></li>)}</ul><button onClick={viewAllResources} className="mt-2 text-sm font-semibold text-[#087443] hover:underline">{text.viewAll} →</button></section>}
        <section className="rounded-xl bg-[#F0F8F2] p-3"><div className="flex items-start gap-3"><BookOpen className="mt-1 shrink-0 text-[#087443]" size={19}/><div><h2 className="text-sm font-bold">{text.suggestTitle}</h2><p className="mt-1 text-xs leading-4 text-[#59645D]">{text.suggestCopy}</p><button type="button" disabled title={text.suggestUnavailable} className="mt-2 min-h-8 rounded-md border border-[#0A7A43] px-3 text-xs font-semibold text-[#087443] opacity-50">{text.suggest}</button></div></div></section>
      </aside>
    </div>}
  </section>;
}

function matchesResourceTab(resource: MemberResource, tab: ResourceTab) {
  const values = `${resource.resourceType} ${resource.category}`.toLocaleLowerCase();
  if (tab === "training") return values.includes("train") || values.includes("learning") || values.includes("course");
  if (tab === "documents") return values.includes("document") || values.includes("organiz") || values.includes("organisation");
  return true;
}

function ResourceTabButton({ selected, onClick, icon: Icon, children }: { selected: boolean; onClick: () => void; icon: typeof Layers3; children: React.ReactNode }) {
  return <button role="tab" aria-selected={selected} onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-2 border-r border-[#E6ECE8] px-2 text-xs font-semibold last:border-r-0 sm:text-sm ${selected ? "bg-[#006B3B] text-white" : "bg-white text-[#17211B] hover:bg-[#F4F8F5]"}`}><Icon size={17} aria-hidden="true"/><span>{children}</span></button>;
}

function ResourceCard({ resource, viewLabel, downloadLabel, previewUnsupported, noFile, pending, inlineSupported, onPreview, onDownload, formatType, formatSize }: {
  resource: MemberResource; viewLabel: string; downloadLabel: string; previewUnsupported: string; noFile: string; pending: boolean; inlineSupported: boolean;
  onPreview: () => void; onDownload: () => void; formatType: (resource: MemberResource) => string; formatSize: (bytes: number) => string;
}) {
  return <article className="flex min-h-[250px] flex-col rounded-xl border border-[#E6ECE8] p-3.5">
    <div className="flex items-start justify-between gap-2"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#EDF7F0] text-[#087443]"><FileText size={25} aria-hidden="true"/></span><span className="max-w-[60%] rounded-md bg-[#EAF5EE] px-2 py-1 text-[11px] font-semibold text-[#087443]">{resource.category}</span></div>
    <h2 className="mt-3 font-bold leading-5 text-[#17211B]">{resource.title}</h2>
    {resource.description && <p className="mt-1 line-clamp-3 text-sm leading-5 text-[#59645D]">{resource.description}</p>}
    <div className="mt-auto flex flex-wrap gap-x-2 pt-4 text-xs text-[#59645D]"><span>{formatType(resource)}</span>{resource.version !== null && <span>v{resource.version}</span>}{resource.fileSize !== null && <span>{formatSize(resource.fileSize)}</span>}</div>
    <ResourceActions resource={resource} viewLabel={viewLabel} downloadLabel={downloadLabel} previewUnsupported={previewUnsupported} noFile={noFile} pending={pending} inlineSupported={inlineSupported} onPreview={onPreview} onDownload={onDownload}/>
  </article>;
}

function ResourceActions({ resource, viewLabel, downloadLabel, previewUnsupported, noFile, pending, inlineSupported, onPreview, onDownload }: {
  resource: MemberResource; viewLabel: string; downloadLabel: string; previewUnsupported: string; noFile: string; pending: boolean; inlineSupported: boolean; onPreview: () => void; onDownload: () => void;
}) {
  const hasFile = resource.version !== null;
  return <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#EDF0EE] pt-3">
    <button type="button" disabled={!hasFile || !inlineSupported || pending} onClick={onPreview} title={!hasFile ? noFile : !inlineSupported ? previewUnsupported : undefined} className="min-h-9 rounded-lg border border-[#0A7A43] px-2 text-xs font-semibold text-[#087443] disabled:cursor-not-allowed disabled:opacity-45">{viewLabel}</button>
    <button type="button" disabled={!hasFile || pending} onClick={onDownload} title={!hasFile ? noFile : undefined} className="min-h-9 rounded-lg bg-[#006B3B] px-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{pending ? "…" : downloadLabel}</button>
    {hasFile && !inlineSupported && <p className="col-span-2 text-[11px] text-[#68736C]">{previewUnsupported}</p>}
  </div>;
}
