"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/modules/i18n/language-provider";
import { PublicNewsNotFoundError, publicPagesService, type PublicNewsArticle } from "../services/public-pages.service";

export default function NewsArticlePage({ slug }: { slug: string }) {
  const { t, locale } = useLanguage();
  const [article, setArticle] = useState<PublicNewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    publicPagesService.getNewsArticle(slug, controller.signal).then(setArticle).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof PublicNewsNotFoundError) setNotFound(true); else setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug]);
  if (loading) return <main className="p-12 text-center text-sm" role="status">{t("articleLoading")}</main>;
  if (notFound) return <main className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-5 text-center"><h1 className="text-2xl font-bold">{t("articleNotFoundTitle")}</h1><p className="mt-2 text-sm text-[#56615B]">{t("articleNotFoundCopy")}</p><Link className="mt-5 text-sm font-semibold text-[#087B49] underline" href="/news">{t("backToNews")}</Link></main>;
  if (failed || !article) return <main className="p-12 text-center text-sm text-red-800" role="alert">{t("articleError")}</main>;
  return <main className="mx-auto min-h-[55vh] max-w-4xl px-5 py-7 sm:px-8 lg:py-10">
    <nav aria-label={t("breadcrumbNavigation")} className="mb-6 flex gap-2 text-xs text-[#57625C]"><Link href="/">{t("home")}</Link><span>›</span><Link href="/news">{t("news")}</Link><span>›</span><span aria-current="page">{article.title}</span></nav>
    <article><time dateTime={article.publishedAt} className="text-sm text-[#627067]">{new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(article.publishedAt))}</time><h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{article.title}</h1>{article.summary && <p className="mt-4 text-lg leading-7 text-[#4F5B54]">{article.summary}</p>}<div className="mt-7 whitespace-pre-wrap break-words text-base leading-8 text-[#303A34]">{article.content}</div></article>
    <Link className="mt-9 inline-block text-sm font-semibold text-[#087B49] underline" href="/news">{t("backToNews")}</Link>
  </main>;
}
