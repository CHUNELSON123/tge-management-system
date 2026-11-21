"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { publicPagesService, type PublicPageContent } from "../services/public-pages.service";
export function PublicPageContentView() {
  const params = useParams<{ slug: string }>(); const [page, setPage] = useState<PublicPageContent | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { const controller = new AbortController(); void publicPagesService.getPage(params.slug, controller.signal).then(setPage).catch((e: unknown) => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Page content is unavailable."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [params.slug]);
  if (loading) return <main className="mx-auto min-h-[55vh] max-w-4xl px-5 py-14" role="status">Loading page…</main>;
  if (!page) return <main className="mx-auto min-h-[55vh] max-w-4xl px-5 py-14"><h1 className="text-3xl font-bold">{error || "Page not found."}</h1><Link className="mt-4 inline-block text-emerald-800 underline" href="/">Return home</Link></main>;
  return <main className="mx-auto min-h-[55vh] max-w-4xl px-5 py-12 sm:py-16"><nav className="mb-6 text-sm text-slate-600"><Link href="/" className="hover:underline">Home</Link><span className="px-2">›</span><span>{page.title}</span></nav><article><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{page.title}</h1><p className="mt-2 text-sm text-slate-500">Updated {new Date(page.publishedAt).toLocaleDateString()}</p><div className="mt-8 whitespace-pre-wrap break-words text-base leading-8 text-slate-700">{page.content}</div></article></main>;
}
