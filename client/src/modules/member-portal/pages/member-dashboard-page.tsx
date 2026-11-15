"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, BookOpen, CalendarDays, Clock3, MapPin, Megaphone, Pencil, UsersRound } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import {
  memberDashboardService,
  MemberDashboardRequestError,
  type MemberDashboard,
} from "../services/member-dashboard.service";

function formatDateTime(value: string, locale: string, timezone?: string | null) {
  const date = new Date(value);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
  try {
    if (timezone) options.timeZone = timezone;
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    delete options.timeZone;
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
}

function excerpt(value: string, maxLength = 150) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trimEnd()}…` : normalized;
}

export function MemberDashboardPage() {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  const load = useCallback((signal: AbortSignal) => {
    setLoading(true);
    setFailed(false);
    const accessToken = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    memberDashboardService.getDashboard(accessToken, signal).then(setDashboard).catch((error: unknown) => {
      if (signal.aborted) return;
      if (error instanceof MemberDashboardRequestError && error.status === 401) {
        localStorage.removeItem("tge.accessToken");
        sessionStorage.removeItem("tge.accessToken");
        router.replace("/login");
        return;
      }
      setFailed(true);
    }).finally(() => {
      if (!signal.aborted) setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, requestVersion]);

  const summaryCards = dashboard ? [
    { key: "dashboardEnrolledProgrammes", value: dashboard.summary.enrolledProgrammes, icon: BookOpen, color: "green" as const },
    { key: "dashboardUpcomingEvents", value: dashboard.summary.upcomingEvents, icon: CalendarDays, color: "blue" as const },
    { key: "dashboardMentorshipSessions", value: dashboard.summary.upcomingMentorshipSessions, icon: UsersRound, color: "purple" as const },
    { key: "dashboardCertificates", value: dashboard.summary.certificatesEarned, icon: Award, color: "amber" as const },
  ] : [];

  return (
    <div aria-busy={loading}>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center" aria-labelledby="member-dashboard-title">
        <div>
          <h1 id="member-dashboard-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">
            {loading && !dashboard ? t("memberDashboardLoadingTitle") : t("dashboardWelcome").replace("{name}", dashboard?.profile.displayName || t("memberRole"))}
          </h1>
          <p className="mt-1 text-sm text-[#59645D] sm:text-base">{t("dashboardWelcomeCopy")}</p>
        </div>
        <Link href="/portal/profile" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2 sm:self-auto">
          <Pencil aria-hidden="true" size={16} />
          {t("dashboardEditProfile")}
        </Link>
      </section>

      {dashboard?.profile.incomplete && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
          <p className="font-semibold">{t("dashboardIncompleteTitle")}</p>
          <p className="mt-1">{t("dashboardIncompleteCopy")}</p>
        </div>
      )}

      {loading && !dashboard && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("loading")}>
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-[#F1F5F2]" />)}
        </div>
      )}

      {failed && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900" role="alert">
          <p className="font-semibold">{t("dashboardLoadError")}</p>
          <button
            type="button"
            onClick={() => setRequestVersion((version) => version + 1)}
            className="mt-3 min-h-10 rounded-lg bg-[#006B3B] px-4 font-semibold text-white hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {dashboard && (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={t("dashboardSummary")}>
            {summaryCards.map(({ key, value, icon: Icon, color }) => {
              const colors = {
                green: "bg-[#F1F7F3] text-[#087340]",
                blue: "bg-[#F0F5FA] text-[#1264A3]",
                purple: "bg-[#F5F1F8] text-[#63429B]",
                amber: "bg-[#FCF7EA] text-[#B77700]",
              };
              return (
                <article key={key} className={`min-h-36 rounded-xl p-4 sm:p-5 ${colors[color]}`}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/80">
                      <Icon aria-hidden="true" size={23} />
                    </span>
                    <h2 className="text-sm font-semibold leading-5 text-[#17211B]">{t(key as "dashboardEnrolledProgrammes" | "dashboardUpcomingEvents" | "dashboardMentorshipSessions" | "dashboardCertificates")}</h2>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-[#111B16]">{value === null ? <span className="text-base">{t("dashboardUnavailable")}</span> : value}</p>
                </article>
              );
            })}
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="dashboard-upcoming-events">
              <div className="flex items-center justify-between gap-3 border-b border-[#EDF0EE] pb-3">
                <h2 id="dashboard-upcoming-events" className="text-lg font-bold text-[#17211B]">{t("dashboardUpcomingEvents")}</h2>
                <span className="text-sm font-semibold text-[#087340]">{dashboard.summary.upcomingEvents ?? t("dashboardUnavailable")}</span>
              </div>
              {dashboard.upcomingEvents.length === 0 ? (
                <p className="py-6 text-sm text-[#68736C]">{dashboard.summary.upcomingEvents === null ? t("dashboardIncompleteData") : t("dashboardNoUpcomingEvents")}</p>
              ) : (
                <ul className="divide-y divide-[#EDF0EE]">
                  {dashboard.upcomingEvents.map((event) => (
                    <li key={event.id} className="flex gap-3 py-4">
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#F1F7F3] text-center text-xs font-bold leading-4 text-[#087340]">
                        <span>{formatDateTime(event.startAt, locale, event.timezone).split(" ").slice(0, 2).join(" ")}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[#17211B]">{event.title}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#59645D]"><Clock3 aria-hidden="true" size={14} />{formatDateTime(event.startAt, locale, event.timezone)}</p>
                        {event.venue && <p className="mt-1 flex items-center gap-1 text-xs text-[#59645D]"><MapPin aria-hidden="true" size={14} />{event.venue}</p>}
                      </div>
                      <span className="hidden h-fit rounded-md bg-[#EEF5F0] px-2 py-1 text-xs font-medium text-[#075C32] sm:inline">{event.eventType}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="dashboard-my-programmes">
              <div className="flex items-center justify-between gap-3 border-b border-[#EDF0EE] pb-3">
                <h2 id="dashboard-my-programmes" className="text-lg font-bold text-[#17211B]">{t("dashboardMyProgrammes")}</h2>
                <span className="text-sm font-semibold text-[#087340]">{dashboard.summary.enrolledProgrammes ?? t("dashboardUnavailable")}</span>
              </div>
              {dashboard.programmes.length === 0 ? (
                <p className="py-6 text-sm text-[#68736C]">{dashboard.profile.incomplete ? t("dashboardIncompleteData") : t("dashboardNoProgrammes")}</p>
              ) : (
                <ul className="divide-y divide-[#EDF0EE]">
                  {dashboard.programmes.map((programme) => (
                    <li key={programme.id} className="flex items-center gap-3 py-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EAF3ED] text-[#087340]"><BookOpen aria-hidden="true" size={21} /></span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[#17211B]">{programme.name}</h3>
                        <p className="text-sm text-[#59645D]">{programme.cohortName}</p>
                      </div>
                      <span className="ml-auto rounded-full bg-[#EEF5F0] px-2.5 py-1 text-xs font-medium text-[#075C32]">{t("dashboardEnrolledStatus")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="dashboard-announcements">
              <div className="border-b border-[#EDF0EE] pb-3">
                <h2 id="dashboard-announcements" className="text-lg font-bold text-[#17211B]">{t("dashboardRecentAnnouncements")}</h2>
              </div>
              {dashboard.recentAnnouncements.length === 0 ? (
                <p className="py-6 text-sm text-[#68736C]">{dashboard.profile.incomplete ? t("dashboardIncompleteData") : t("dashboardNoAnnouncements")}</p>
              ) : (
                <ul className="divide-y divide-[#EDF0EE]">
                  {dashboard.recentAnnouncements.map((announcement) => (
                    <li key={announcement.id} className="flex gap-3 py-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EEF5F0] text-[#087340]" aria-hidden="true"><Megaphone size={19} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-semibold text-[#17211B]">{announcement.title}</h3>
                          <time className="text-xs text-[#68736C]" dateTime={announcement.publishedAt}>{new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(announcement.publishedAt))}</time>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-[#59645D]">{excerpt(announcement.content)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="dashboard-quick-links">
              <div className="border-b border-[#EDF0EE] pb-3">
                <h2 id="dashboard-quick-links" className="text-lg font-bold text-[#17211B]">{t("dashboardQuickLinks")}</h2>
              </div>
              <p className="py-6 text-sm text-[#68736C]">{t("dashboardQuickLinksUnavailable")}</p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
