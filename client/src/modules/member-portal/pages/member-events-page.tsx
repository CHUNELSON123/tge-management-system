"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, MapPin, Search, TicketCheck } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useMemberEvents } from "../hooks/use-member-events";
import type { MemberEventTab } from "../types/member-events.types";

function formatDateTime(value: string, locale: string, timezone: string | null, options: Intl.DateTimeFormatOptions) {
  const formatOptions = { ...options };
  if (timezone) formatOptions.timeZone = timezone;
  try { return new Intl.DateTimeFormat(locale, formatOptions).format(new Date(value)); }
  catch { delete formatOptions.timeZone; return new Intl.DateTimeFormat(locale, formatOptions).format(new Date(value)); }
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function downloadCalendar(event: { title: string; description: string | null; startAt: string; endAt: string | null; timezone: string | null; venue: string | null }) {
  const icsDate = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Green Entrepreneur//Member Portal//EN", "CALSCALE:GREGORIAN"];
  if (event.timezone) lines.push(`X-WR-TIMEZONE:${escapeIcs(event.timezone)}`);
  lines.push("BEGIN:VEVENT", `UID:${crypto.randomUUID()}@tge-canada.org`, `DTSTAMP:${icsDate(new Date().toISOString())}`, `DTSTART:${icsDate(event.startAt)}`);
  if (event.endAt) lines.push(`DTEND:${icsDate(event.endAt)}`);
  lines.push(`SUMMARY:${escapeIcs(event.title)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
  if (event.venue) lines.push(`LOCATION:${escapeIcs(event.venue)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${event.title.replace(/[^\p{L}\p{N}-]+/gu, "-") || "event"}.ics`; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function EventCalendar({ events, locale, t }: { events: Array<{ startAt: string }>; locale: string; t: (key: "memberPreviousMonth" | "memberNextMonth" | "memberCalendarEventCount" | "memberCalendarEventCountPlural") => string }) {
  const [month, setMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1); });
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const eventDays = new Set(events.filter((event) => { const d = new Date(event.startAt); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth(); }).map((event) => new Date(event.startAt).getDate()));
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month);
  return <section className="rounded-xl border border-[#E6ECE8] bg-white p-4" aria-label={monthName}>
    <div className="flex items-center justify-between"><h2 className="text-sm font-bold text-[#17211B]">{monthName}</h2><div className="flex gap-1"><button type="button" aria-label={t("memberPreviousMonth")} onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} className="grid h-8 w-8 place-items-center rounded border border-[#E6ECE8] hover:bg-[#F2F8F4]">‹</button><button type="button" aria-label={t("memberNextMonth")} onClick={() => setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} className="grid h-8 w-8 place-items-center rounded border border-[#E6ECE8] hover:bg-[#F2F8F4]">›</button></div></div>
    <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] text-[#68736C]">{Array.from({ length: 7 }, (_, index) => <span key={index}>{new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(new Date(2024, 0, 7 + index))}</span>)}</div>
    <div className="mt-2 grid grid-cols-7 gap-1 text-center">{Array.from({ length: firstDay }, (_, index) => <span key={`empty-${index}`} />)}{Array.from({ length: days }, (_, index) => { const day = index + 1; return <span key={day} className={`relative grid h-8 place-items-center rounded-full text-xs ${eventDays.has(day) ? "bg-[#087340] font-semibold text-white" : "text-[#39443D]"}`}>{day}{eventDays.has(day) && <i className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[#8DD0A7]" />}</span>; })}</div>
    <p className="mt-3 text-[11px] text-[#68736C]">● {eventDays.size} {t(eventDays.size === 1 ? "memberCalendarEventCount" : "memberCalendarEventCountPlural")}</p>
  </section>;
}

const tabs: Array<{ id: MemberEventTab; key: "memberTabUpcoming" | "memberTabPast" | "memberTabSaved" }> = [
  { id: "upcoming", key: "memberTabUpcoming" }, { id: "past", key: "memberTabPast" }, { id: "saved", key: "memberTabSaved" },
];

export function MemberEventsPage() {
  const { locale, t } = useLanguage();
  const events = useMemberEvents();
  const calendarEvents = useMemo(() => events.allEvents.filter((event) => Date.parse(event.startAt) >= Date.now()), [events.allEvents]);
  return <section aria-labelledby="member-events-title" aria-busy={events.loading}>
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 id="member-events-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{t("memberEventsTitle")}</h1><p className="mt-1 text-sm text-[#59645D]">{t("memberEventsDescription")}</p></div><Link href="/events" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"><CalendarDays aria-hidden="true" size={17} />{t("memberBrowseEvents")}</Link></header>
    <div className="mt-5 flex flex-col gap-4 xl:flex-row">
      <div className="min-w-0 flex-1">
        <div role="tablist" aria-label={t("memberEventsTitle")} className="flex overflow-x-auto border-b border-[#E4EAE6]">{tabs.map(({ id, key }) => <button key={id} type="button" role="tab" aria-selected={events.tab === id} onClick={() => events.setTab(id)} className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#147E4A] ${events.tab === id ? "border-[#087340] text-[#075C32]" : "border-transparent text-[#39443D] hover:text-[#075C32]"}`}>{t(key)}</button>)}</div>
        {events.tab === "saved" ? <p className="mt-4 rounded-xl border border-[#E6ECE8] bg-[#F7F9F7] p-5 text-sm text-[#59645D]" role="status">{t("memberEventSavedUnavailable")}</p> : <>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]"><label className="relative block"><span className="sr-only">{t("memberEventSearch")}</span><Search aria-hidden="true" size={17} className="absolute left-3 top-3 text-[#738078]" /><input type="search" value={events.search} onChange={(event) => events.setSearch(event.target.value)} placeholder={t("memberEventSearch")} className="min-h-10 w-full rounded-md border border-[#D8E0DB] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#087340] focus:ring-2 focus:ring-[#087340]/20" /></label><label><span className="sr-only">{t("memberEventCategory")}</span><select value={events.category} onChange={(event) => events.setCategory(event.target.value)} className="min-h-10 w-full rounded-md border border-[#D8E0DB] bg-white px-3 text-sm text-[#39443D] focus:border-[#087340] focus:outline-none focus:ring-2 focus:ring-[#087340]/20"><option value="all">{t("memberEventCategory")}</option>{events.categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label></div>
          {events.loading && <div className="mt-4 space-y-3" aria-label={t("loading")}>{[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-[#F1F5F2]" />)}</div>}
          {events.failed && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900" role="alert"><p>{t("memberEventsError")}</p><button type="button" onClick={events.retry} className="mt-3 rounded-md bg-[#006B3B] px-4 py-2 font-semibold text-white">{t("retry")}</button></div>}
          {!events.loading && !events.failed && (events.events.length === 0 ? <p className="mt-4 rounded-xl border border-[#E6ECE8] bg-white px-4 py-12 text-center text-sm text-[#68736C]">{events.emptyMessage}</p> : <ul className="mt-4 space-y-3">{events.events.map((event) => {
            const image = events.gallery.find((item) => item.eventId === event.id) ?? null;
            return <li key={event.id}><article className="rounded-xl border border-[#E6ECE8] bg-white p-3 shadow-[0_2px_10px_#111B1608] sm:grid sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-4 sm:p-4">
              {image ? <Image unoptimized src={image.url} alt={image.altText} width={640} height={420} className="mb-3 aspect-[16/9] w-full rounded-lg object-cover sm:mb-0 sm:h-full sm:min-h-28 sm:aspect-auto" /> : <div className="mb-3 grid aspect-[16/9] place-items-center rounded-lg bg-[#F1F7F3] text-[#087340] sm:mb-0 sm:h-full sm:min-h-28 sm:aspect-auto"><CalendarDays aria-hidden="true" size={34} /></div>}
              <div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="rounded-md bg-[#E5F5EA] px-2 py-1 text-[11px] font-semibold text-[#075C32]">{Date.parse(event.startAt) >= Date.now() ? t("memberTabUpcoming") : t("memberTabPast")}</span><span className="rounded-md bg-[#F0F3F1] px-2 py-1 text-[11px] font-medium text-[#39443D]">{event.eventType}</span></div><h2 className="mt-2 text-base font-bold text-[#17211B]">{event.title}</h2>
                <p className="mt-2 flex items-center gap-2 text-xs text-[#59645D]"><CalendarDays aria-hidden="true" size={15} />{formatDateTime(event.startAt, locale, event.timezone, { month: "short", day: "numeric", year: "numeric" })} · {formatDateTime(event.startAt, locale, event.timezone, { hour: "numeric", minute: "2-digit" })}{event.endAt && ` – ${formatDateTime(event.endAt, locale, event.timezone, { hour: "numeric", minute: "2-digit" })}`}</p>
                {event.venue && <p className="mt-1 flex items-center gap-2 text-xs text-[#59645D]"><MapPin aria-hidden="true" size={15} />{event.venue}</p>}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row"><Link href={`/portal/events/${encodeURIComponent(event.id)}`} className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#006B3B] px-4 text-xs font-semibold text-white hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{t("memberEventDetails")}</Link><button type="button" onClick={() => downloadCalendar(event)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#087340] px-4 text-xs font-semibold text-[#075C32] hover:bg-[#F2F8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"><CalendarDays aria-hidden="true" size={15} />{t("memberEventCalendar")}</button></div>
              </div>
            </article></li>;
          })}</ul>)}
        </>}
      </div>

      <aside className="hidden w-full shrink-0 space-y-4 xl:block xl:w-56">
        <section className="rounded-xl border border-[#E6ECE8] bg-white p-4" aria-labelledby="member-event-stats-title"><h2 id="member-event-stats-title" className="text-sm font-bold text-[#17211B]">{t("memberEventStatistics")}</h2><ul className="mt-3 space-y-4"><li className="flex items-center gap-3"><CalendarDays aria-hidden="true" className="text-[#087340]" size={22} /><p><strong className="block text-lg">{events.upcomingCount}</strong><span className="text-xs text-[#59645D]">{t("memberUpcomingCount")}</span></p></li><li className="flex items-center gap-3"><TicketCheck aria-hidden="true" className="text-[#087340]" size={22} /><p><strong className="block text-lg">{events.pastCount}</strong><span className="text-xs text-[#59645D]">{t("memberPastCount")}</span></p></li><li className="flex items-center gap-3"><CalendarDays aria-hidden="true" className="text-[#8A9490]" size={22} /><p><strong className="block text-lg">—</strong><span className="text-xs text-[#59645D]">{t("memberSavedCount")}</span></p></li></ul></section>
        <EventCalendar events={calendarEvents} locale={locale} t={t} />
        <section className="rounded-xl bg-[#F1F7F3] p-4"><h2 className="text-sm font-bold text-[#17211B]">{t("memberSavedCount")}</h2><p className="mt-2 text-xs leading-5 text-[#59645D]">{t("memberEventSavedUnavailable")}</p></section>
      </aside>
    </div>
  </section>;
}
