"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { publicPagesService, type PublicNewsArticle } from "../services/public-pages.service";
import { NewsletterSubscriptionForm } from "../components/newsletter-subscription-form";

export default function NewsPage() {
  const { t, locale } = useLanguage();
  const [articles, setArticles] = useState<PublicNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    publicPagesService.getNews(controller.signal).then(setArticles).catch(() => { if (!controller.signal.aborted) setFailed(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  const dateLocale = locale === "fr" ? "fr-CA" : "en-CA";
  return <main className="bg-white text-[#151A18]">
    <section className="relative overflow-hidden bg-[#052719] text-white">
      <div className="absolute inset-y-0 right-0 hidden w-[62%] bg-[url('/public-pages/news-hero.png')] bg-cover bg-center sm:block" />
      <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#052719_0%,rgba(5,39,25,.96)_34%,rgba(5,39,25,.2)_68%,rgba(5,39,25,.02)_100%)] sm:block" />
      <div className="relative mx-auto max-w-[1440px] sm:min-h-[245px] sm:content-center">
        <div className="px-5 pb-6 pt-8 sm:max-w-[560px] sm:px-8 sm:py-8 lg:px-10">
          <nav aria-label={t("breadcrumbNavigation")} className="mb-4 flex gap-2 text-xs text-white/80"><Link href="/">{t("home")}</Link><span>›</span><span aria-current="page">{t("news")}</span></nav>
          <p className="text-3xl font-bold">{t("newsEyebrow")}</p><h1 className="mt-1 text-xl font-bold text-[#26C875]">{t("newsTagline")}</h1>
          <p className="mt-3 max-w-[470px] text-sm leading-6 text-white/90">{t("newsIntro")}</p>
        </div>
        <div className="h-40 bg-[url('/public-pages/news-hero.png')] bg-cover bg-center sm:hidden" role="img" aria-label={t("newsEyebrow")} />
      </div>
    </section>

    <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[1fr_280px] lg:px-10 lg:py-9">
      <section aria-labelledby="latest-news-heading">
        <h2 id="latest-news-heading" className="text-xl font-bold">{t("latestNews")}</h2>
        {loading ? <p className="py-12 text-center text-sm text-[#56615B]" role="status">{t("newsLoading")}</p> : failed ? <p className="my-5 rounded-lg bg-red-50 p-5 text-sm text-red-800" role="alert">{t("newsError")}</p> : articles.length === 0 ? <p className="mt-5 rounded-lg bg-[#F4F8F5] p-8 text-center text-sm text-[#56615B]" role="status">{t("newsEmpty")}</p> : <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{articles.map((article) => <li key={article.id} className="flex flex-col rounded-xl border border-[#E5EBE7] bg-white p-5 shadow-[0_3px_15px_#10251a0b]">
          <div className="mb-4 flex h-24 items-center justify-center rounded-lg bg-[#EEF5F0] text-[#087B49]"><Newspaper aria-hidden="true" size={34}/></div>
          <time dateTime={article.publishedAt} className="text-xs text-[#627067]">{new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(article.publishedAt))}</time>
          <h3 className="mt-2 text-lg font-bold leading-6"><Link className="hover:text-[#087B49] focus-visible:outline focus-visible:outline-2" href={`/news/${encodeURIComponent(article.slug)}`}>{article.title}</Link></h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[#56615B]">{article.summary || article.content}</p>
          <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#087B49] hover:underline" href={`/news/${encodeURIComponent(article.slug)}`}>{t("readMore")} <ArrowRight aria-hidden="true" size={15}/></Link>
        </li>)}</ul>}
      </section>
      <aside className="h-fit rounded-xl border border-[#E5EBE7] bg-[#F5F8F6] p-5">
        <h2 className="font-bold text-[#075C32]">{t("newsletterPlacementTitle")}</h2><p className="mt-2 text-sm leading-5 text-[#56615B]">{t("newsletterPlacementCopy")}</p><NewsletterSubscriptionForm source="news-sidebar" compact />
      </aside>
    </div>
  </main>;
}
