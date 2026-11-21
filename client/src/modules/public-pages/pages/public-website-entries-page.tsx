"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPublicEntries, type PublicEntryKind, type PublicWebsiteEntry } from "../services/public-website-entries.service";
const headings: Record<PublicEntryKind, string> = { blog: "Blog", testimonial: "Testimonials", faq: "Frequently Asked Questions" };
export function PublicWebsiteEntriesPage({ kind, slug }: { kind: PublicEntryKind; slug?: string }) {
  const [data, setData] = useState<PublicWebsiteEntry[] | PublicWebsiteEntry | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    getPublicEntries(kind, slug, controller.signal).then(setData).catch(() => { if (!controller.signal.aborted) setError("This content is unavailable."); });
    return () => controller.abort();
  }, [kind, slug]);
  return <main className="mx-auto min-h-[55vh] max-w-5xl px-5 py-12"><h1 className="text-3xl font-bold text-slate-950">{headings[kind]}</h1>{error ? <p role="alert" className="mt-6">{error}</p> : !data ? <p role="status" className="mt-6">Loading…</p> : Array.isArray(data) ? data.length ? <div className="mt-8 grid gap-4">{data.map(item => <article key={item.slug} className="rounded-lg border p-5"><h2 className="text-xl font-bold">{kind === "blog" ? <Link className="text-emerald-800 hover:underline" href={`/blog/${item.slug}`}>{item.title}</Link> : item.title}</h2>{item.summary && <p className="mt-2 text-slate-600">{item.summary}</p>}{kind !== "blog" && <p className="mt-3 whitespace-pre-wrap text-slate-700">{item.content}</p>}</article>)}</div> : <p className="mt-6 text-slate-600">No published content yet.</p> : <article className="mt-8"><h2 className="text-2xl font-bold">{data.title}</h2>{data.summary && <p className="mt-3 text-slate-600">{data.summary}</p>}<p className="mt-6 whitespace-pre-wrap break-words leading-7">{data.content}</p></article>}</main>;
}
