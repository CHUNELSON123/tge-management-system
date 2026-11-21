"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { websiteSettingsService, type WebsiteSettings } from "@/modules/public-pages/services/website-settings.service";
import { adminWebsiteService } from "../services/admin-website.service";
import type { WebsiteRow, WebsiteStatus } from "../types/admin-website.types";
import { messages } from "@/modules/i18n/messages";
import contactMessages from "@/modules/public-pages/contact-messages.json";

const token = () => localStorage.getItem("tge.accessToken") || sessionStorage.getItem("tge.accessToken") || "";
type Section = "About Us" | "Contact Us" | "Footer & social media" | "Newsletter" | "News";
const sections: Section[] = ["About Us", "Contact Us", "Footer & social media", "Newsletter", "News"];
type Field = { key: keyof WebsiteSettings; label: string; type?: string; multiline?: boolean; hint?: string; placeholder?: string };
type FieldGroup = { title: string; description?: string; fields: Field[] };
const en = messages.en;
const contact = contactMessages.en;
const contactDetails: Field[] = [
  { key: "address", label: "Office address", placeholder: contact.officeValue },
  { key: "email", label: "Contact email", type: "email", placeholder: "info@tge-cameroon.org" },
  { key: "phone", label: "Phone number", type: "tel", placeholder: "+237 675 123 456" },
  { key: "hours", label: "Office hours", placeholder: contact.hoursValue },
];
const groups: Record<Exclude<Section, "News">, FieldGroup[]> = {
  "About Us": [
    { title: "1. Opening banner", description: "The first text visitors see at the top of About Us.", fields: [
      { key: "aboutHeroTitle", label: "Main headline", multiline: true, placeholder: `${en.aboutHeadlineFirst}\n${en.aboutHeadlineSecond}`, hint: "Use a new line to split the headline." },
      { key: "aboutHeroIntro", label: "Introduction", multiline: true, placeholder: en.aboutHeroCopy },
    ] },
    { title: "2. Our story", description: "The story shown beside the organisation image.", fields: [
      { key: "aboutTitle", label: "Story heading", placeholder: en.aboutStoryTitle },
      { key: "aboutContent", label: "Story", multiline: true, placeholder: `${en.aboutStoryCopyOne}\n\n${en.aboutStoryCopyTwo}` },
    ] },
    { title: "3. Mission, vision and values", description: "The three short summaries beside the story.", fields: [
      { key: "aboutMission", label: "Our mission", multiline: true, placeholder: en.aboutMissionCopy },
      { key: "aboutVision", label: "Our vision", multiline: true, placeholder: en.aboutVisionCopy },
      { key: "aboutValuesSummary", label: "Values summary", multiline: true, placeholder: en.aboutValuesSummary },
    ] },
    { title: "4. Value cards", description: "The five cards shown under Our Values. Change a title or its explanation independently.", fields: [
      { key: "aboutInclusionTitle", label: "Value 1 title", placeholder: en.aboutInclusion }, { key: "aboutInclusionText", label: "Value 1 description", multiline: true, placeholder: en.aboutInclusionCopy },
      { key: "aboutCollaborationTitle", label: "Value 2 title", placeholder: en.aboutCollaboration }, { key: "aboutCollaborationText", label: "Value 2 description", multiline: true, placeholder: en.aboutCollaborationCopy },
      { key: "aboutInnovationTitle", label: "Value 3 title", placeholder: en.aboutInnovation }, { key: "aboutInnovationText", label: "Value 3 description", multiline: true, placeholder: en.aboutInnovationCopy },
      { key: "aboutIntegrityTitle", label: "Value 4 title", placeholder: en.aboutIntegrity }, { key: "aboutIntegrityText", label: "Value 4 description", multiline: true, placeholder: en.aboutIntegrityCopy },
      { key: "aboutImpactTitle", label: "Value 5 title", placeholder: en.aboutImpact }, { key: "aboutImpactText", label: "Value 5 description", multiline: true, placeholder: en.aboutImpactCopy },
    ] },
    { title: "5. Our impact", description: "The statement below the value cards.", fields: [
      { key: "aboutImpactStatement", label: "Impact statement", multiline: true, placeholder: en.aboutImpactStatement }, { key: "aboutImpactNote", label: "Additional note", multiline: true, placeholder: en.aboutImpactNote },
    ] },
    { title: "6. Join the community", description: "The invitation at the bottom of the page.", fields: [{ key: "aboutCommunityTitle", label: "Heading", placeholder: en.homeCommunityTitle }, { key: "aboutCommunityText", label: "Description", multiline: true, placeholder: en.homeCommunityCopy }] },
  ],
  "Contact Us": [
    { title: "1. Opening banner", description: "The heading and introduction at the top of Contact Us.", fields: [
      { key: "contactTitle", label: "Page heading", placeholder: contact.heading }, { key: "contactSubheading", label: "Subheading", placeholder: contact.subheading }, { key: "contactContent", label: "Introduction", multiline: true, placeholder: contact.intro },
    ] },
    { title: "2. Contact details", description: "These details appear on the Contact Us page and in the footer. Editing them here updates both places.", fields: [{ key: "contactChannels", label: "Introduction to contact details", placeholder: contact.channels }, ...contactDetails] },
    { title: "3. Message form", description: "The text above the visitor's contact form.", fields: [{ key: "contactFormTitle", label: "Form heading", placeholder: contact.sendMessage }, { key: "contactFormCopy", label: "Form introduction", multiline: true, placeholder: contact.formCopy }] },
    { title: "4. Partnership section", description: "The partnership invitation at the bottom of the page. Its button opens an email to the contact address above.", fields: [{ key: "contactPartnerTitle", label: "Heading", placeholder: contact.partnerTitle }, { key: "contactPartnerCopy", label: "Description", multiline: true, placeholder: contact.partnerCopy }, { key: "contactPartnerLink", label: "Button text", placeholder: contact.partnerLink }] },
  ],
  "Footer & social media": [
    { title: "Contact information", description: "Shared with the Contact Us page.", fields: contactDetails },
    { title: "Social media links", description: "Enter the full HTTPS address for each account. Only configured links are shown.", fields: (["facebook", "linkedin", "instagram", "youtube"] as const).map(key => ({ key, label: `${key[0].toUpperCase()}${key.slice(1)} URL`, type: "url", placeholder: `https://www.${key}.com/your-page` })) },
  ],
  "Newsletter": [{ title: "Subscription notifications", description: "This address receives a notification when a visitor subscribes. Subscribers are saved in the system.", fields: [{ key: "newsletterEmail", label: "Notification email address", type: "email", placeholder: "newsletter@example.org" }] }],
};
const input = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-100";
function ContentField({ field, value, onChange }: { field: Field; value: string; onChange: (value: string) => void }) {
  const id = `website-content-${field.key}`;
  const canCopy = !value && field.placeholder && (field.key.startsWith("about") || field.key.startsWith("contact"));
  return <div className={`min-w-0 ${field.multiline ? "md:col-span-2" : ""}`}>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-800">{field.label}</label>
    {field.hint && <p className="mt-1 text-xs text-slate-500">{field.hint}</p>}
    {field.multiline ? <textarea id={id} rows={field.key === "aboutContent" ? 6 : 3} maxLength={12000} className={`${input} resize-y`} placeholder={field.placeholder} value={value} onChange={e => onChange(e.target.value)}/> : <input id={id} type={field.type || "text"} className={input} placeholder={field.placeholder} value={value} onChange={e => onChange(e.target.value)}/>}
    {canCopy && <button type="button" className="mt-1 text-xs font-medium text-green-700 underline" onClick={() => onChange(field.placeholder!)}>Use the current default text</button>}
  </div>;
}
export function AdminWebsitePage() {
  const [section, setSection] = useState<Section>("About Us");
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [news, setNews] = useState<WebsiteRow[]>([]);
  const [newsPage, setNewsPage] = useState(1); const [newsTotal, setNewsTotal] = useState(0);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  async function loadNews(page = newsPage) { const data = await adminWebsiteService.list(token(), { type: "news", page, pageSize: 25 }); setNews(data.rows); setNewsTotal(data.total); }
  useEffect(() => { websiteSettingsService.get(token()).then(setSettings).catch(e => setError(e.message)); }, []);
  useEffect(() => { const controller = new AbortController(); adminWebsiteService.list(token(), { type: "news", page: newsPage, pageSize: 25 }, controller.signal).then(data => { setNews(data.rows); setNewsTotal(data.total); }).catch(e => { if (!controller.signal.aborted) setError(e.message); }); return () => controller.abort(); }, [newsPage]);
  async function save(event: FormEvent) { event.preventDefault(); if (!settings) return; setBusy(true); setError(""); setNotice(""); try { setSettings(await websiteSettingsService.save(token(), settings)); setNotice("Changes saved and available on the website."); } catch (e) { setError(e instanceof Error ? e.message : "Changes could not be saved."); } finally { setBusy(false); } }
  async function changeStatus(item: WebsiteRow, status: WebsiteStatus) { setBusy(true); setError(""); try { await adminWebsiteService.transition(token(), "news", item.id, status); await loadNews(); setNotice(`“${item.title}” is ${status}.`); } catch (e) { setError(e instanceof Error ? e.message : "News could not be updated."); } finally { setBusy(false); } }
  return <section className="mx-auto max-w-6xl space-y-5 text-slate-900"><header><h1 className="text-2xl font-bold sm:text-3xl">Website Content</h1><p className="mt-1 text-sm text-slate-600">Manage your public pages, contact details, newsletter notifications and news.</p></header>
    <nav aria-label="Website content sections" className="flex gap-2 overflow-x-auto border-b">{sections.map(item => <button key={item} type="button" onClick={() => { setSection(item); setNotice(""); }} className={`shrink-0 border-b-2 px-3 py-3 text-sm ${section === item ? "border-green-700 font-semibold text-green-700" : "border-transparent"}`}>{item}</button>)}</nav>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="rounded bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {section === "News" ? <div className="rounded-lg border bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">News articles</h2><p className="text-sm text-slate-600">Only published articles appear on the public website.</p></div><Link href="/admin/website/new?type=news" className="rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white">Add news</Link></div><ul className="mt-4 divide-y">{news.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><Link className="font-semibold text-green-800 underline" href={`/admin/website/news/${item.id}`}>{item.title}</Link><p className="text-slate-500">{item.status}</p></div><div className="flex gap-2"><Link href={`/admin/website/news/${item.id}`} className="rounded border px-3 py-2">Edit</Link>{item.status !== "archived" && <button disabled={busy} onClick={() => void changeStatus(item, item.status === "published" ? "draft" : "published")} className="rounded border border-green-700 px-3 py-2 text-green-700 disabled:opacity-50">{item.status === "published" ? "Unpublish" : "Publish"}</button>}</div></li>)}{!news.length && <li className="py-5 text-sm text-slate-500">No news articles yet.</li>}</ul><div className="flex items-center gap-3 text-sm"><button type="button" disabled={newsPage <= 1} onClick={() => setNewsPage(p => p - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Previous</button><span>Page {newsPage} of {Math.max(1, Math.ceil(newsTotal / 25))}</span><button type="button" disabled={newsPage * 25 >= newsTotal} onClick={() => setNewsPage(p => p + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button></div></div> : <form onSubmit={save} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-green-100 bg-green-50 p-4">
        <div><h2 className="text-lg font-semibold text-slate-900">{section}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Edit the sections in the same order they appear on the website. For page text, grey examples show the English default. Leave a field empty to use the default, or select it to make edits. Social links show example formats. Custom text appears in both languages.</p></div>
        {(section === "About Us" || section === "Contact Us") && <Link href={section === "About Us" ? "/about" : "/contact"} target="_blank" className="rounded-md border border-green-700 bg-white px-4 py-2 text-sm font-semibold text-green-700">View public page ↗</Link>}
      </div>
      {!settings ? <p className="rounded-lg border bg-white p-5 text-sm text-slate-600">Loading settings…</p> : groups[section].map(group => <fieldset key={group.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><legend className="sr-only">{group.title}</legend><h3 className="text-base font-bold text-slate-900">{group.title}</h3>{group.description && <p className="mt-1 text-sm text-slate-600">{group.description}</p>}<div className="mt-5 grid gap-5 md:grid-cols-2">{group.fields.map(field => <ContentField key={field.key} field={field} value={settings[field.key]} onChange={value => setSettings({ ...settings, [field.key]: value })}/>)}</div></fieldset>)}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4"><p className="text-sm text-slate-600">Saving updates all changes you have made on this page.</p><button disabled={busy || !settings} className="min-h-11 rounded-md bg-green-700 px-6 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50">{busy ? "Saving…" : "Save changes"}</button></div>
    </form>}
  </section>;
}
