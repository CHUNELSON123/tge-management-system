"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { publicPagesService, type PublicEvent, type PublicEventsList } from "../services/public-pages.service";
import { formatEventTime, getEventDateBadge } from "../utils/event-formatters";

function EventCard({ event, past = false }: { event: PublicEvent; past?: boolean }) {
  const { t, locale } = useLanguage();
  const date = getEventDateBadge(event.startAt, locale === "fr" ? "fr-CA" : "en-CA", event.timezone);

  return (
    <article className="flex min-h-full flex-col rounded-xl border border-[#E5EBE7] bg-white p-4 shadow-[0_3px_15px_#10251a0b]">
      <div className="flex gap-3">
        <div className="flex h-[76px] w-[62px] shrink-0 flex-col items-center justify-center rounded-lg bg-[#F0F6F2] text-[#075C32]">
          <span className="text-xs font-bold uppercase">{date.month}</span>
          <span className="text-2xl font-extrabold leading-7">{date.day}</span>
          <span className="text-[10px] uppercase">{date.weekday}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-flex rounded bg-[#E8F3EC] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#087B49]">{event.eventType}</span>
          <h3 className="mt-1 text-base font-bold leading-5 text-[#1A211D]">{event.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-4 text-[#56615B]">{event.description || t("eventDescriptionUnavailable")}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2 border-t border-[#E9EEEB] pt-3 text-xs text-[#4D5852]">
        <p className="flex items-center gap-2"><Clock3 aria-hidden="true" size={14} className="shrink-0 text-[#087B49]" />{formatEventTime(event.startAt, locale === "fr" ? "fr-CA" : "en-CA", event.timezone)}{event.endAt && ` – ${formatEventTime(event.endAt, locale === "fr" ? "fr-CA" : "en-CA", event.timezone)}`}</p>
        {event.venue && <p className="flex items-center gap-2"><MapPin aria-hidden="true" size={14} className="shrink-0 text-[#087B49]" />{event.venue}</p>}
      </div>
      <Link href={`/events/${encodeURIComponent(event.id)}`} className="mt-4 inline-flex min-h-9 w-fit items-center gap-2 rounded-md border border-[#087B49] px-3 text-xs font-semibold text-[#087B49] hover:bg-[#F2F8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2">
        {t("viewEventDetails")} <ArrowRight aria-hidden="true" size={14} />
      </Link>
      {past && <span className="sr-only">{t("eventStatusPast")}</span>}
    </article>
  );
}

export default function EventsPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<PublicEventsList>({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    publicPagesService.getEvents(controller.signal)
      .then(setEvents)
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="bg-white text-[#151A18]">
      <section className="relative overflow-hidden bg-[#052719] text-white">
        <div className="absolute inset-y-0 right-0 hidden w-[65%] bg-[url('/public-pages/events-hero.png')] bg-cover bg-[position:62%_center] sm:block" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,#052719_0%,rgba(5,39,25,.94)_34%,rgba(5,39,25,.18)_65%,rgba(5,39,25,.04)_100%)] sm:block" />
        <div className="relative mx-auto grid max-w-[1440px] sm:min-h-[250px] sm:items-center lg:min-h-[270px]">
          <div className="px-5 pb-6 pt-8 sm:max-w-[560px] sm:px-8 sm:py-8 lg:px-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#20C875]">{t("eventsEyebrow")}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{t("eventsHeadlineFirst")}<br />{t("eventsHeadlineSecond")}</h1>
            <p className="mt-3 max-w-[480px] text-sm leading-6 text-white/90">{t("eventsHeroCopy")}</p>
          </div>
          <div className="h-44 bg-[url('/public-pages/events-hero.png')] bg-cover bg-[position:75%_center] sm:hidden" role="img" aria-label={t("eventsHeroImage")} />
        </div>
      </section>

      {loading ? (
        <p role="status" className="mx-auto max-w-[1440px] px-5 py-10 text-center text-sm text-[#4D5852] sm:px-8 lg:px-10">{t("eventsLoading")}</p>
      ) : failed ? (
        <p role="alert" className="mx-auto my-8 max-w-[1400px] rounded-lg border border-[#E7C7C3] bg-[#FFF7F6] px-4 py-8 text-center text-sm text-[#8B2E24]">{t("eventsError")}</p>
      ) : (
        <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
          <div className="mb-6 flex justify-end"><Link href="/events/gallery" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#087B49] px-4 text-sm font-semibold text-[#087B49] hover:bg-[#F2F8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{t("eventGallery")} <ArrowRight aria-hidden="true" size={16} /></Link></div>
          <section aria-labelledby="upcoming-events-heading">
            <h2 id="upcoming-events-heading" className="flex items-center gap-2 text-xl font-bold"><CalendarDays aria-hidden="true" className="h-5 w-5 text-[#078348]" />{t("upcomingEvents")}</h2>
            {events.upcoming.length === 0 ? (
              <p role="status" className="mt-4 rounded-lg bg-[#F4F8F5] px-4 py-7 text-center text-sm text-[#56615B]">{t("upcomingEventsEmpty")}</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{events.upcoming.map((event) => <EventCard key={event.id} event={event} />)}</div>
            )}
          </section>

          <section aria-labelledby="past-events-heading" className="mt-8">
            <h2 id="past-events-heading" className="flex items-center gap-2 text-xl font-bold"><CalendarDays aria-hidden="true" className="h-5 w-5 text-[#078348]" />{t("pastEvents")}</h2>
            {events.past.length === 0 ? (
              <p role="status" className="mt-4 rounded-lg bg-[#F4F8F5] px-4 py-7 text-center text-sm text-[#56615B]">{t("pastEventsEmpty")}</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{events.past.map((event) => <EventCard key={event.id} event={event} past />)}</div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
