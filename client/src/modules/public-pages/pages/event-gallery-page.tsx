"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/modules/i18n/language-provider";
import { publicPagesService, type PublicGalleryItem } from "../services/public-pages.service";

export default function EventGalleryPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<PublicGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    publicPagesService.getEventGallery(controller.signal).then(setItems).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <main className="mx-auto min-h-[55vh] max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">
    <nav aria-label={t("breadcrumbNavigation")} className="mb-5 flex gap-2 text-xs text-[#57625C]"><Link href="/">{t("home")}</Link><span>›</span><Link href="/events">{t("events")}</Link><span>›</span><span aria-current="page">{t("eventGallery")}</span></nav>
    <h1 className="text-3xl font-bold">{t("eventGallery")}</h1><p className="mt-2 text-sm text-[#56615B]">{t("eventGalleryIntro")}</p>
    {loading ? <p className="py-12 text-center" role="status">{t("eventGalleryLoading")}</p> : failed ? <p className="py-12 text-center text-red-800" role="alert">{t("eventGalleryError")}</p> : items.length === 0 ? <p className="mt-6 rounded-lg bg-[#F4F8F5] px-4 py-12 text-center text-sm text-[#56615B]">{t("eventGalleryEmpty")}</p> : <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{items.map((item) => <li key={item.id}><Link href={`/events/${encodeURIComponent(item.eventId)}`}><Image unoptimized src={item.url} alt={item.altText} width={640} height={480} className="aspect-[4/3] w-full rounded-lg object-cover"/><span className="mt-2 block font-semibold">{item.eventTitle}</span></Link></li>)}</ul>}
  </main>;
}
