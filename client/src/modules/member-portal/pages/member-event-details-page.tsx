"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, MapPin, Tag, TicketCheck } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useMemberEvents } from "../hooks/use-member-events";
import type { MemberEventSection } from "../types/member-events.types";

const sections: Array<{ id: MemberEventSection; key: "memberEventOverview" | "memberEventAgenda" | "memberEventSpeakers" | "memberEventLocation" | "memberEventAttendees" | "memberEventResources" }> = [
  { id: "overview", key: "memberEventOverview" },
  { id: "agenda", key: "memberEventAgenda" },
  { id: "speakers", key: "memberEventSpeakers" },
  { id: "location", key: "memberEventLocation" },
  { id: "attendees", key: "memberEventAttendees" },
  { id: "resources", key: "memberEventResources" },
];

function formatDateTime(value: string, locale: string, timezone: string | null, options: Intl.DateTimeFormatOptions) {
  const formatOptions = { ...options };
  if (timezone) formatOptions.timeZone = timezone;
  try { return new Intl.DateTimeFormat(locale, formatOptions).format(new Date(value)); }
  catch { delete formatOptions.timeZone; return new Intl.DateTimeFormat(locale, formatOptions).format(new Date(value)); }
}

export function MemberEventDetailsPage({ eventId }: { eventId: string }) {
  const { locale, t } = useLanguage();
  const eventQuery = useMemberEvents(eventId);
  const [section, setSection] = useState<MemberEventSection>("overview");
  const event = eventQuery.details;
  if (eventQuery.loading) return <section aria-busy="true"><div className="h-8 w-48 animate-pulse rounded bg-[#F1F5F2]" /><div className="mt-5 h-64 animate-pulse rounded-xl bg-[#F1F5F2]" /></section>;
  if (eventQuery.notFound) return <section role="status" className="rounded-xl border border-[#E6ECE8] p-6 text-center"><h1 className="text-xl font-bold text-[#17211B]">{t("memberEventNotFound")}</h1><Link href="/portal/events" className="mt-4 inline-flex min-h-10 items-center rounded-md bg-[#006B3B] px-4 text-sm font-semibold text-white">{t("memberBackToEvents")}</Link></section>;
  if (eventQuery.failed || !event) return <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900"><p>{t("memberEventDetailsError")}</p><button type="button" onClick={eventQuery.retry} className="mt-3 rounded-md bg-[#006B3B] px-4 py-2 font-semibold text-white">{t("retry")}</button></section>;

  const registrationActive = event.registrationStatus === "registered";
  const unavailableSection = section === "agenda" || section === "speakers";
  return <section aria-labelledby="member-event-detail-title" aria-busy={eventQuery.loading}>
    <Link href="/portal/events" className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[#087340] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]"><span aria-hidden="true">←</span>{t("memberBackToEvents")}</Link>
    <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${registrationActive ? "bg-[#E4F5EA] text-[#075C32]" : "bg-[#F0F3F1] text-[#4B5650]"}`}><CheckCircle2 aria-hidden="true" size={14} />{registrationActive ? t("memberEventRegistered") : t("memberEventNotRegistered")}</span><span className="rounded-full bg-[#EEF5F0] px-3 py-1 text-xs font-semibold text-[#075C32]">{event.eventType}</span></div>
        <h1 id="member-event-detail-title" className="mt-3 text-2xl font-bold text-[#111B16] sm:text-3xl">{event.title}</h1>
        {event.description && <p className="mt-2 text-sm leading-6 text-[#59645D]">{event.description}</p>}
        {eventQuery.detailImage && <Image unoptimized src={eventQuery.detailImage.url} alt={eventQuery.detailImage.altText} width={1200} height={560} className="mt-4 aspect-[16/7] w-full rounded-xl object-cover" />}

        <div className="mt-4 grid gap-3 rounded-xl border border-[#E6ECE8] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 text-[#087340]" size={19} /><div><p className="text-sm font-semibold text-[#17211B]">{formatDateTime(event.startAt, locale, event.timezone, { month: "short", day: "numeric", year: "numeric" })}</p><p className="text-xs text-[#68736C]">{formatDateTime(event.startAt, locale, event.timezone, { weekday: "long" })}</p></div></div>
          <div className="flex items-start gap-3"><Clock3 aria-hidden="true" className="mt-0.5 text-[#087340]" size={19} /><div><p className="text-sm font-semibold text-[#17211B]">{formatDateTime(event.startAt, locale, event.timezone, { hour: "numeric", minute: "2-digit" })}{event.endAt && ` – ${formatDateTime(event.endAt, locale, event.timezone, { hour: "numeric", minute: "2-digit" })}`}</p><p className="text-xs text-[#68736C]">{event.timezone || t("memberEventTimezoneUnavailable")}</p></div></div>
          <div className="flex items-start gap-3"><MapPin aria-hidden="true" className="mt-0.5 text-[#087340]" size={19} /><div><p className="text-sm font-semibold text-[#17211B]">{event.venue || t("memberEventSectionUnavailable")}</p><p className="text-xs text-[#68736C]">{t("memberEventLocation")}</p></div></div>
          <div className="flex items-start gap-3"><Tag aria-hidden="true" className="mt-0.5 text-[#087340]" size={19} /><div><p className="text-sm font-semibold text-[#17211B]">{event.eventType}</p><p className="text-xs text-[#68736C]">{t("memberEventType")}</p></div></div>
        </div>

        <div role="tablist" aria-label={t("memberEventOverview")} className="mt-5 flex overflow-x-auto border-b border-[#E4EAE6]">{sections.map(({ id, key }) => <button key={id} type="button" role="tab" aria-selected={section === id} aria-controls="member-event-section-panel" onClick={() => setSection(id)} className={`min-h-11 shrink-0 border-b-2 px-3 text-xs font-semibold sm:px-4 sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#147E4A] ${section === id ? "border-[#087340] text-[#075C32]" : "border-transparent text-[#39443D] hover:text-[#075C32]"}`}>{t(key)}</button>)}</div>
        <section id="member-event-section-panel" role="tabpanel" className="mt-4 rounded-xl border border-[#E6ECE8] bg-white p-4 sm:p-5">
          {section === "overview" && <><h2 className="text-lg font-bold text-[#17211B]">{t("memberEventOverview")}</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#59645D]">{event.description || t("memberEventSectionUnavailable")}</p></>}
          {section === "location" && <><h2 className="text-lg font-bold text-[#17211B]">{t("memberEventLocation")}</h2><p className="mt-3 flex items-center gap-2 text-sm text-[#59645D]">{event.venue ? <><MapPin aria-hidden="true" className="text-[#087340]" size={17} />{event.venue}</> : t("memberEventSectionUnavailable")}</p></>}
          {section === "attendees" && <><h2 className="text-lg font-bold text-[#17211B]">{t("memberEventAttendees")}</h2><p className="mt-3 text-sm text-[#59645D]">{t("memberEventAttendeesUnavailable")}</p></>}
          {section === "resources" && <><h2 className="text-lg font-bold text-[#17211B]">{t("memberEventResources")}</h2><p className="mt-3 text-sm text-[#59645D]">{t("memberEventResourcesUnavailable")}</p></>}
          {unavailableSection && <><h2 className="text-lg font-bold text-[#17211B]">{t(section === "agenda" ? "memberEventAgenda" : "memberEventSpeakers")}</h2><p className="mt-3 text-sm text-[#59645D]">{t("memberEventSectionUnavailable")}</p></>}
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl border border-[#E6ECE8] bg-white p-4" aria-labelledby="member-event-registration-title"><h2 id="member-event-registration-title" className="text-base font-bold text-[#17211B]">{t("memberEventRegistrationDate")}</h2><div className={`mt-3 rounded-lg p-3 ${registrationActive ? "bg-[#F1F7F3]" : "bg-[#F7F8F7]"}`}><p className="flex items-center gap-2 text-sm font-semibold text-[#075C32]"><CheckCircle2 aria-hidden="true" size={18} />{registrationActive ? t("memberEventRegistered") : t("memberEventNotRegistered")}</p>{event.registeredAt && <time dateTime={event.registeredAt} className="mt-1 block text-xs text-[#59645D]">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(event.registeredAt))}</time>}</div><div className="mt-4 flex items-start gap-3"><TicketCheck aria-hidden="true" className="text-[#68736C]" size={18} /><p className="text-sm text-[#59645D]">{t("memberEventTicket")}</p></div>{registrationActive && <p className="mt-3 rounded-md border border-[#E6ECE8] p-3 text-xs leading-5 text-[#68736C]">{t("memberEventCancelUnavailable")}</p>}</section>
        <section className="rounded-xl bg-[#F1F7F3] p-4"><h2 className="text-sm font-bold text-[#17211B]">{t("memberEventOrganizerUnavailable")}</h2><p className="mt-2 text-xs leading-5 text-[#59645D]">{t("memberEventSectionUnavailable")}</p></section>
      </aside>
    </div>
  </section>;
}
