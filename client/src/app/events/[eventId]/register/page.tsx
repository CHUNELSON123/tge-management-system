"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/modules/i18n/language-provider";
import { publicPagesService, type PublicEventDetails } from "@/modules/public-pages/services/public-pages.service";
import { formatEventDate, formatEventTime } from "@/modules/public-pages/utils/event-formatters";

export default function EventRegistrationPage() {
  const { t, locale } = useLanguage();
  const params = useParams<{ eventId: string }>();
  const eventId = params.eventId;
  const [event, setEvent] = useState<PublicEventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    publicPagesService.getEventDetails(eventId, controller.signal).then(setEvent).catch(() => setError(t("eventNotFoundCopy"))).finally(() => setLoading(false));
    return () => controller.abort();
  }, [eventId, t]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(""); setSuccess("");
    const form = new FormData(e.currentTarget);
    try {
      const result = await publicPagesService.registerForEvent(eventId, { name: String(form.get("name")), email: String(form.get("email")), phone: String(form.get("phone")), consent: form.get("consent") === "on" });
      setSuccess(t("registrationSuccess").replace("{event}", result.eventTitle));
    } catch (err) { setError(err instanceof Error ? err.message : t("registrationError")); }
    finally { setBusy(false); }
  }
  if (loading) return <main className="p-12 text-center" role="status">{t("eventLoading")}</main>;
  if (!event || !event.isUpcoming) return <main className="mx-auto max-w-3xl p-10 text-center"><p role="alert">{error || t("registrationClosed")}</p><Link className="mt-4 inline-block text-green-800 underline" href={`/events/${eventId}`}>{t("backToEvents")}</Link></main>;
  return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <nav aria-label={t("breadcrumbNavigation")} className="mb-5 flex flex-wrap gap-2 text-xs"><Link href="/">{t("home")}</Link><span>›</span><Link href="/events">{t("events")}</Link><span>›</span><Link href={`/events/${eventId}`}>{t("eventDetailsHeading")}</Link><span>›</span><span>{t("registerForEvent")}</span></nav>
    <h1 className="text-3xl font-bold">{t("registerForEvent")}</h1><p className="mt-2 text-sm text-gray-600">{t("registrationIntro")}</p>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
      <form onSubmit={submit} className="space-y-4 rounded-xl border p-5">
        <h2 className="text-xl font-bold">{event.title}</h2><p className="text-sm text-gray-600">{formatEventDate(event.startAt, locale === "fr" ? "fr-CA" : "en-CA", event.timezone)} · {formatEventTime(event.startAt, locale === "fr" ? "fr-CA" : "en-CA", event.timezone)}</p>
        <label className="block text-sm font-medium">{t("registrationFullName")}<input required minLength={2} maxLength={200} name="name" autoComplete="name" className="mt-1 w-full rounded border p-3" /></label>
        <label className="block text-sm font-medium">{t("emailAddress")}<input required type="email" maxLength={255} name="email" autoComplete="email" className="mt-1 w-full rounded border p-3" /></label>
        <label className="block text-sm font-medium">{t("registrationPhone")}<input required type="tel" maxLength={30} name="phone" autoComplete="tel" className="mt-1 w-full rounded border p-3" /></label>
        <label className="flex items-start gap-2 text-sm"><input required type="checkbox" name="consent" className="mt-1" /><span>{t("registrationConsent")}</span></label>
        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}{success && <p role="status" className="text-sm text-green-800">{success}</p>}
        <button disabled={busy || !!success} className="w-full rounded bg-[#006B3B] px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? t("registrationSubmitting") : t("confirmRegistration")}</button>
      </form>
      <aside className="h-fit rounded-xl bg-[#F1F7F3] p-5 text-sm"><h2 className="font-bold">{t("secureRegistration")}</h2><p className="mt-2">{t("registrationPrivacyNotice")}</p></aside>
    </div>
  </main>;
}
