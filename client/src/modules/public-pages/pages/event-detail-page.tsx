"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { publicPagesService, PublicEventNotFoundError, type PublicEventDetails } from "../services/public-pages.service";
import { formatEventDate, formatEventTime } from "../utils/event-formatters";

function EventTime({ event }: { event: PublicEventDetails }) {
  const { t, locale } = useLanguage();
  const dateLocale = locale === "fr" ? "fr-CA" : "en-CA";
  return (
    <div className="flex items-start gap-3">
      <CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#087B49]" />
      <div>
        <p className="font-semibold">{formatEventDate(event.startAt, dateLocale, event.timezone)}</p>
        <p className="mt-1 text-sm text-[#58635D]">
          <Clock3 aria-hidden="true" className="mr-1 inline h-4 w-4 text-[#087B49]" />
          {formatEventTime(event.startAt, dateLocale, event.timezone)}
          {event.endAt && ` – ${formatEventTime(event.endAt, dateLocale, event.timezone)}`}
        </p>
        {event.timezone && <p className="mt-1 text-xs text-[#68736D]">{event.timezone}</p>}
      </div>
      <span className="sr-only">{t("eventDateAndTime")}</span>
    </div>
  );
}

export default function EventDetailPage({ eventId }: { eventId: string }) {
  const { t, locale } = useLanguage();
  const [event, setEvent] = useState<PublicEventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const dateLocale = locale === "fr" ? "fr-CA" : "en-CA";

  useEffect(() => {
    const controller = new AbortController();
    publicPagesService.getEventDetails(eventId, controller.signal)
      .then(setEvent)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof PublicEventNotFoundError) setNotFound(true);
        else setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [eventId]);

  if (loading) {
    return <main className="mx-auto max-w-5xl px-5 py-16 text-center text-sm text-[#56615B]" role="status">{t("eventLoading")}</main>;
  }

  if (notFound) {
    return (
      <main className="mx-auto flex min-h-[360px] max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
        <h1 className="text-2xl font-bold text-[#18221C]">{t("eventNotFoundTitle")}</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-[#56615B]">{t("eventNotFoundCopy")}</p>
        <Link href="/events" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-[#087B49] px-4 text-sm font-semibold text-white hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2"><ArrowLeft aria-hidden="true" size={16} />{t("backToEvents")}</Link>
      </main>
    );
  }

  if (failed || !event) {
    return <main className="mx-auto max-w-3xl px-5 py-16 text-center text-sm text-[#8B2E24]" role="alert">{t("eventDetailError")}</main>;
  }

  const isUpcoming = event.isUpcoming;

  return (
    <main className="bg-white text-[#151A18]">
      <div className="mx-auto max-w-[1200px] px-5 pt-4 sm:px-8 lg:px-10">
        <nav aria-label={t("breadcrumbNavigation")} className="flex flex-wrap items-center gap-2 text-xs text-[#57625C]">
          <Link href="/" className="hover:text-[#087B49]">{t("home")}</Link><span aria-hidden="true">›</span>
          <Link href="/events" className="hover:text-[#087B49]">{t("events")}</Link><span aria-hidden="true">›</span>
          <span aria-current="page" className="font-semibold text-[#087B49]">{t("eventDetailsHeading")}</span>
        </nav>
      </div>

      <section className="mx-auto max-w-[1200px] px-5 pb-7 pt-5 sm:px-8 lg:px-10">
        <div className="max-w-4xl">
          <span className={`inline-flex rounded px-2.5 py-1 text-xs font-bold ${isUpcoming ? "bg-[#E6F3EA] text-[#087B49]" : "bg-[#EEF0EF] text-[#525D56]"}`}>{t(isUpcoming ? "eventStatusUpcoming" : "eventStatusPast")}</span>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{event.title}</h1>
          <p className="mt-2 text-sm text-[#56615B] sm:text-base">{event.description || t("eventDescriptionUnavailable")}</p>
        </div>
        <div className="mt-5 h-48 overflow-hidden rounded-xl bg-[url('/public-pages/event-detail-hero.png')] bg-cover bg-center sm:h-[300px]" role="img" aria-label={t("eventDetailHeroImage")} />
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-6 px-5 pb-9 sm:px-8 lg:grid-cols-[1fr_330px] lg:px-10">
        <article className="rounded-xl border border-[#E6ECE8] p-5 sm:p-6">
          <h2 className="text-xl font-bold">{t("aboutThisEvent")}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#46514B]">{event.description || t("eventDescriptionUnavailable")}</p>
          <div className="mt-5 grid gap-4 border-t border-[#E8EEEA] pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#087B49]" /><div><p className="text-xs font-semibold uppercase text-[#65716A]">{t("eventTypeLabel")}</p><p className="mt-1 text-sm font-semibold">{event.eventType}</p></div></div>
            {event.venue && <div className="flex items-start gap-3"><MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#087B49]" /><div><p className="text-xs font-semibold uppercase text-[#65716A]">{t("eventVenueLabel")}</p><p className="mt-1 text-sm font-semibold">{event.venue}</p></div></div>}
          </div>
        </article>

        <aside className="h-fit space-y-4">
          <section className="rounded-xl border border-[#E6ECE8] p-5 shadow-[0_3px_16px_#10251a0a]">
            <h2 className="text-lg font-bold">{t("eventDetailsHeading")}</h2>
            <div className="mt-4"><EventTime event={event} /></div>
            {event.venue && <div className="mt-4 flex items-start gap-3 border-t border-[#E8EEEA] pt-4"><MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#087B49]" /><div><p className="text-xs font-semibold uppercase text-[#65716A]">{t("eventVenueLabel")}</p><p className="mt-1 text-sm font-semibold">{event.venue}</p></div></div>}
            {isUpcoming && <Link href={`/events/${encodeURIComponent(event.id)}/register`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2">{t("registerForEvent")}</Link>}
          </section>

          {event.relatedEvents.length > 0 && <section className="rounded-xl border border-[#E6ECE8] p-5">
            <h2 className="text-lg font-bold">{t("relatedEvents")}</h2>
            <ul className="mt-3 divide-y divide-[#E8EEEA]">
              {event.relatedEvents.map((related) => <li key={related.id} className="py-3 first:pt-0 last:pb-0"><Link href={`/events/${encodeURIComponent(related.id)}`} className="font-semibold text-[#075C32] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{related.title}</Link><time className="mt-1 block text-xs text-[#65716A]" dateTime={related.startAt}>{formatEventDate(related.startAt, dateLocale, related.timezone)}</time></li>)}
            </ul>
          </section>}
        </aside>
      </section>
    </main>
  );
}
