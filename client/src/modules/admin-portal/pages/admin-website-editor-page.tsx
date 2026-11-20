"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { adminWebsiteService } from "../services/admin-website.service";
import type { WebsiteDetail, WebsiteType } from "../types/admin-website.types";
const token = () => localStorage.getItem("tge.accessToken") || sessionStorage.getItem("tge.accessToken") || "";
const toSlug = (text: string) => text.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const types: WebsiteType[] = ["page", "news", "blog", "testimonial", "faq", "media"];
const names: Record<WebsiteType, string> = { page: "Page", news: "News", blog: "Blog Post", testimonial: "Testimonial", faq: "FAQ", media: "Media" };
const input = "mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 font-normal";
export function AdminWebsiteEditorPage({ create = false }: { create?: boolean }) {
  const params = useParams<{ type?: string; id?: string }>();
  const search = useSearchParams(); const router = useRouter();
  const candidate = create ? search.get("type") : params.type;
  const type: WebsiteType = types.includes(candidate as WebsiteType) ? candidate as WebsiteType : "page";
  const id = params.id;
  const [item, setItem] = useState<WebsiteDetail | null>(null);
  const [title, setTitle] = useState(""); const [slug, setSlug] = useState(""); const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState(""); const [content, setContent] = useState(""); const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(!create); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  useEffect(() => {
    if (create || !id) return;
    const controller = new AbortController();
    adminWebsiteService.get(token(), type, id, controller.signal).then(data => { if (!controller.signal.aborted) { setItem(data); setTitle(data.title); setSlug(data.slug); setSlugTouched(true); setSummary(data.summary || ""); setContent(data.content); } }).catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Content could not be loaded."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [create, id, type]);
  async function save(event?: FormEvent, publish = false) {
    event?.preventDefault(); if (busy) return; setBusy(true); setError(""); setNotice("");
    try {
      let saved: WebsiteDetail;
      if (type === "media") { if (!create || !file) throw new Error("Select an image to upload."); saved = await adminWebsiteService.upload(token(), file); }
      else { const body = { title: title.trim(), slug: slug.trim(), ...(type === "news" || type === "blog" ? { summary: summary.trim() } : {}), content: content.trim() }; saved = create ? await adminWebsiteService.create(token(), type, body) : await adminWebsiteService.update(token(), type, id!, body); }
      if (publish && saved.status === "draft") saved = await adminWebsiteService.transition(token(), type, saved.id, "published");
      setItem(saved); setNotice(publish ? "Content published." : "Changes saved.");
      if (create) router.replace(`/admin/website/${type}/${saved.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Content could not be saved."); } finally { setBusy(false); }
  }
  async function changeStatus(status: "draft" | "published" | "archived") { if (!item) return; setBusy(true); setError(""); try { setItem(await adminWebsiteService.transition(token(), type, item.id, status)); setNotice(`Content is now ${status}.`); } catch (e) { setError(e instanceof Error ? e.message : "Status could not be changed."); } finally { setBusy(false); } }
  if (loading) return <p role="status" className="p-12 text-center">Loading content…</p>;
  const publicPath = type === "page" ? `/pages/${slug}` : type === "news" ? `/news/${slug}` : type === "blog" ? `/blog/${slug}` : type === "faq" ? "/faqs" : type === "testimonial" ? "/testimonials" : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/public/website-media/${item?.id || ""}`;
  return <section className="mx-auto max-w-6xl space-y-5"><header><Link href="/admin/website" className="inline-flex items-center gap-2 text-sm text-blue-700"><ArrowLeft size={16}/>Back to Website Content</Link><h1 className="mt-2 text-2xl font-bold">{create ? "Create Content" : `${names[type]} Editor`}</h1><p className="mt-1 text-sm text-[#31558f]">Create and publish content for the public website.</p></header>
    {(error || notice) && <p role={error ? "alert" : "status"} className={`rounded p-3 text-sm ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}>{error || notice}</p>}
    {!create && !item ? <p>Content not found. <Link href="/admin/website" className="underline">Return to content list</Link></p> : <form onSubmit={e => void save(e)} className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,.8fr)]"><div className="space-y-4 rounded-xl border bg-white p-5">
      {create && <label className="block text-sm font-semibold">Content type<select value={type} onChange={e => router.replace(`/admin/website/new?type=${e.target.value}`)} className={input}>{types.map(value => <option key={value} value={value}>{names[value]}</option>)}</select></label>}
      {type === "media" ? <>{create ? <label className="block text-sm font-semibold">Image file<input type="file" accept="image/png,image/jpeg,image/webp" required onChange={e => setFile(e.target.files?.[0] || null)} className={input}/><span className="text-xs font-normal text-slate-500">PNG, JPEG or WebP, up to 3 MB.</span></label> : <p className="text-sm">File: {item?.title}</p>}</> : <>
      <label className="block text-sm font-semibold">{type === "faq" ? "Question" : type === "testimonial" ? "Name / title" : "Title"}<input required maxLength={250} value={title} onChange={e => { setTitle(e.target.value); if (!slugTouched) setSlug(toSlug(e.target.value)); }} className={input}/></label>
      <label className="block text-sm font-semibold">URL slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={280} value={slug} onChange={e => {setSlug(toSlug(e.target.value));setSlugTouched(true);}} className={input}/></label>
      {(type === "news" || type === "blog") && <label className="block text-sm font-semibold">Summary<textarea required={type === "news"} maxLength={500} value={summary} onChange={e => setSummary(e.target.value)} className={`${input} min-h-24 py-2`}/></label>}
      <label className="block text-sm font-semibold">{type === "faq" ? "Answer" : type === "testimonial" ? "Testimonial" : "Content"}<textarea required maxLength={100000} value={content} onChange={e => setContent(e.target.value)} className={`${input} min-h-64 py-2`}/><span className="text-xs font-normal text-slate-500">Plain text; HTML is not supported.</span></label></>}
      <div className="flex flex-wrap gap-2 border-t pt-4"><Link href="/admin/website" className="rounded border px-4 py-2 text-sm">Cancel</Link>{(type !== "media" || create) && <button disabled={busy} type="submit" className="inline-flex items-center gap-2 rounded border border-blue-700 px-4 py-2 text-sm text-blue-800 disabled:opacity-50"><Save size={16}/>{busy ? "Saving…" : create ? "Save Draft" : "Save Changes"}</button>}{create && <button disabled={busy || (type === "media" ? !file : !title.trim() || !slug.trim() || !content.trim() || (type === "news" && !summary.trim()))} type="button" onClick={() => void save(undefined, true)} className="rounded bg-[#006b3b] px-4 py-2 text-sm text-white disabled:opacity-50">Save &amp; Publish</button>}{!create && item?.status === "draft" && <button type="button" disabled={busy} onClick={() => void (type === "media" ? changeStatus("published") : save(undefined, true))} className="rounded bg-[#006b3b] px-4 py-2 text-sm text-white disabled:opacity-50">Publish</button>}{!create && item?.status === "published" && <button type="button" disabled={busy} onClick={() => void changeStatus("draft")} className="rounded border px-4 py-2 text-sm">Unpublish</button>}{!create && item?.status === "archived" && <button type="button" disabled={busy} onClick={() => void changeStatus("draft")} className="rounded border px-4 py-2 text-sm">Restore to Draft</button>}</div>
    </div><aside className="space-y-4"><section className="rounded-xl border bg-white p-4"><h2 className="font-bold">Preview</h2><div className="mt-3 rounded bg-slate-50 p-4"><h3 className="text-xl font-bold">{title || file?.name || "Untitled content"}</h3>{summary && <p className="mt-2 text-sm">{summary}</p>}<p className="mt-3 whitespace-pre-wrap break-words text-sm">{content}</p></div></section>{item && <section className="rounded-xl border bg-white p-4 text-sm"><p>Status: <strong className="capitalize">{item.status}</strong></p><p className="mt-2">Author: {item.authorName}</p>{item.status === "published" && <a href={publicPath} target="_blank" rel="noreferrer" className="mt-3 inline-block text-emerald-700 underline">View public content</a>}</section>}</aside></form>}
  </section>;
}
