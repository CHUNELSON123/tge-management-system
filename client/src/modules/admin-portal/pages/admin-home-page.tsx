"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  FileText,
  GraduationCap,
  Info,
  Plus,
  Clock3,
  TrendingUp,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import type { TranslationKey } from "@/modules/i18n/messages";
import { AdminDashboardMetricCard } from "../components/admin-dashboard-metric-card";
import { AdminDashboardPanel } from "../components/admin-dashboard-panel";
import { useAdminDashboard } from "../hooks/use-admin-dashboard";

function monthKeys(from: string, to: string) {
  if (!from || !to) return [];
  const first = new Date(`${from.slice(0, 7)}-01T00:00:00.000Z`);
  const last = new Date(`${to.slice(0, 7)}-01T00:00:00.000Z`);
  const keys: string[] = [];
  for (const cursor = new Date(first); cursor <= last; cursor.setUTCMonth(cursor.getUTCMonth() + 1)) {
    keys.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function dateLabel(date: string, locale: string, timeZone = "UTC") {
  const useLocale = locale === "fr" ? "fr-CA" : "en-CA";
  try {
    return new Intl.DateTimeFormat(useLocale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(date));
  } catch {
    return new Intl.DateTimeFormat(useLocale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(date));
  }
}

function rangeDateLabel(date: string, locale: string) {
  if (!date) return "";
  const useLocale = locale === "fr" ? "fr-CA" : "en-CA";
  return new Intl.DateTimeFormat(useLocale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00.000Z`));
}

function activityLabel(kind: string): TranslationKey {
  const labels: Record<string, TranslationKey> = {
    "member-created": "adminActivityMemberCreated",
    "application-received": "adminActivityApplicationReceived",
    "programme-created": "adminActivityProgrammeCreated",
    "event-created": "adminActivityEventCreated",
    "resource-created": "adminActivityResourceCreated",
    "business-created": "adminActivityBusinessCreated",
    "participant-enrolled": "adminActivityParticipantEnrolled",
  };
  return labels[kind] ?? "adminActivityRecordCreated";
}

function accountStatusLabel(status: string, translate: (key: TranslationKey) => string) {
  const labels: Record<string, TranslationKey> = {
    ACTIVE: "adminAccountActive",
    PENDING_ACTIVATION: "adminAccountPendingActivation",
    SUSPENDED: "adminAccountSuspended",
    DEACTIVATED: "adminAccountDeactivated",
  };
  const key = labels[status.toUpperCase()];
  return key ? translate(key) : status.replaceAll("_", " ").toLowerCase();
}

function accountStatusColor(status: string) {
  const colors: Record<string, string> = {
    ACTIVE: "#16864D",
    PENDING_ACTIVATION: "#E5A300",
    SUSPENDED: "#C96B35",
    DEACTIVATED: "#9AA49D",
  };
  return colors[status.toUpperCase()] ?? "#CBD2CD";
}

function MemberGrowthChart({
  values,
  locale,
  numberFormat,
  emptyLabel,
}: {
  values: Array<{ month: string; joined: number }>;
  locale: string;
  numberFormat: Intl.NumberFormat;
  emptyLabel: string;
}) {
  if (values.length === 0 || values.every(({ joined }) => joined === 0)) {
    return <p className="grid min-h-52 place-items-center rounded-lg bg-[#F7FAF8] px-4 text-center text-sm text-[#65736A]">{emptyLabel}</p>;
  }

  const chart = { width: 600, height: 236, left: 46, right: 8, top: 12, bottom: 34 };
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const maxValue = Math.max(...values.map(({ joined }) => joined));
  const scaleMax = Math.max(4, Math.ceil(maxValue / 4) * 4);
  const monthStep = plotWidth / values.length;
  const barWidth = Math.min(30, monthStep * 0.55);
  const chartLocale = locale === "fr" ? "fr-CA" : "en-CA";
  const chartLabel = values.map(({ month, joined }) => {
    const monthName = new Intl.DateTimeFormat(chartLocale, { month: "short", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00.000Z`));
    return `${monthName}: ${numberFormat.format(joined)}`;
  }).join(", ");

  return (
    <div className="overflow-x-auto" role="img" aria-label={chartLabel}>
      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-56 min-w-0 w-full" preserveAspectRatio="none" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((step) => {
          const value = (scaleMax / 4) * (4 - step);
          const y = chart.top + (plotHeight / 4) * step;
          return (
            <g key={step}>
              <text x={chart.left - 8} y={y + 4} textAnchor="end" className="fill-[#65736A] text-[10px]">{numberFormat.format(value)}</text>
              <line x1={chart.left} y1={y} x2={chart.width - chart.right} y2={y} stroke="#E6ECE8" strokeWidth="1" />
            </g>
          );
        })}
        {values.map(({ month, joined }, index) => {
          const x = chart.left + index * monthStep + (monthStep - barWidth) / 2;
          const barHeight = (joined / scaleMax) * plotHeight;
          const monthName = new Intl.DateTimeFormat(chartLocale, { month: "short", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00.000Z`));
          return (
            <g key={month}>
              <rect x={x} y={chart.top + plotHeight - barHeight} width={barWidth} height={barHeight} rx="3" fill={index === values.length - 1 ? "#087542" : "#70C59B"}>
                <title>{`${monthName}: ${numberFormat.format(joined)}`}</title>
              </rect>
              <text x={x + barWidth / 2} y={chart.height - 9} textAnchor="middle" className="fill-[#65736A] text-[10px]">{monthName}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type QuickAction = {
  label: TranslationKey;
  href: string;
  permission: string[];
  icon: LucideIcon;
};

const quickActions: QuickAction[] = [
  { label: "adminAddMember", href: "/admin/members/new", permission: ["members.manage", "users.manage"], icon: Users },
  { label: "adminCreateProgramme", href: "/admin/programmes/new", permission: ["programmes.manage"], icon: GraduationCap },
  { label: "adminUploadResource", href: "/admin/resources/new", permission: ["resources.manage"], icon: FileText },
  { label: "adminCreateEvent", href: "/admin/events/new", permission: ["events.manage"], icon: CalendarDays },
];

export function AdminHomePage({ initialRange }: { initialRange: { from: string; to: string } }) {
  const { t, locale } = useLanguage();
  const {
    range,
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    dashboard,
    loading,
    error,
    rangeError,
    applyRange,
    retry,
    permissions,
  } = useAdminDashboard(initialRange);

  const monthlyGrowth = useMemo(() => {
    if (!range || !dashboard) return [];
    const counts = new Map(dashboard.memberGrowth.map(({ month, joined }) => [month, joined]));
    return monthKeys(range.from, range.to).map((month) => ({ month, joined: counts.get(month) ?? 0 }));
  }, [dashboard, range]);

  const numberFormat = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA");
  const availableActions = quickActions.filter(({ permission }) => permission.every((required) => permissions.includes(required)));
  const metrics = dashboard ? [
    { label: t("adminMetricTotalMembers"), value: dashboard.summary.totalMemberProfiles, icon: Users, accent: "text-emerald-700 bg-emerald-50" },
    { label: t("adminMetricPublishedProgrammes"), value: dashboard.summary.publishedProgrammes, icon: GraduationCap, accent: "text-sky-600 bg-sky-50" },
    { label: t("adminMetricMentorsTrainers"), value: dashboard.summary.activeMentorsAndTrainers, icon: UsersRound, accent: "text-violet-600 bg-violet-50" },
    { label: t("adminMetricPublishedEvents"), value: dashboard.summary.publishedEventsInRange, icon: CalendarDays, accent: "text-amber-600 bg-amber-50" },
    { label: t("adminMetricPublicBusinesses"), value: dashboard.summary.publiclyListedBusinesses, icon: BriefcaseBusiness, accent: "text-emerald-700 bg-emerald-50" },
  ] : [];

  const accountCounts = dashboard?.memberCountsByStatus ?? [];
  const accountTotal = accountCounts.reduce((sum, item) => sum + item.count, 0);
  let accountPosition = 0;
  const accountSegments = accountCounts.map(({ status, count }) => {
    const start = accountPosition;
    accountPosition += count;
    return `${accountStatusColor(status)} ${(start / Math.max(1, accountTotal)) * 100}% ${(accountPosition / Math.max(1, accountTotal)) * 100}%`;
  });
  const accountDonut = accountTotal === 0 ? "#E8EFEB 0% 100%" : accountSegments.join(", ");

  return (
    <div className="mx-auto max-w-[1400px] space-y-5" aria-busy={loading}>
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17211B]">{t("adminDashboard")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#52645A]">{t("adminDashboardSubtitle")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <details className="group relative">
            <summary aria-label={t("adminDateRange")} className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border border-[#D7E3DA] bg-white px-3 text-sm text-[#17211B] shadow-sm hover:bg-[#F8FBF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] [&::-webkit-details-marker]:hidden">
              <CalendarDays aria-hidden="true" size={17} className="shrink-0 text-[#087542]" />
              <span className="whitespace-nowrap">{rangeDateLabel(range.from, locale)} - {rangeDateLabel(range.to, locale)}</span>
              <ChevronDown aria-hidden="true" size={15} className="ml-1 shrink-0 text-[#52645A] transition-transform group-open:rotate-180" />
            </summary>
            <form onSubmit={applyRange} className="absolute right-0 z-30 mt-2 grid w-[min(19rem,calc(100vw-2rem))] gap-3 rounded-xl border border-[#E0E8E3] bg-white p-4 shadow-xl" aria-label={t("adminDateRange")}>
              <label htmlFor="admin-range-from" className="block text-xs font-semibold text-[#52645A]">{t("adminFromDate")}<input id="admin-range-from" type="date" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-[#DCE5DF] px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]" /></label>
              <label htmlFor="admin-range-to" className="block text-xs font-semibold text-[#52645A]">{t("adminToDate")}<input id="admin-range-to" type="date" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-[#DCE5DF] px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]" /></label>
              {rangeError && <p role="alert" className="text-xs font-medium text-red-700">{t("adminInvalidRange")}</p>}
              <button type="submit" className="min-h-10 rounded-md bg-[#006B3B] px-4 text-sm font-semibold text-white hover:bg-[#075C32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2">{t("adminApplyRange")}</button>
            </form>
          </details>

          {availableActions.length > 0 && (
            <details className="group relative self-end">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-lg bg-[#087542] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#06663A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                <Plus aria-hidden="true" size={17} />
                <span>{t("adminAddNew")}</span>
              </summary>
              <div className="absolute right-0 z-30 mt-2 min-w-52 rounded-lg border border-[#E0E8E3] bg-white p-1.5 shadow-lg">
                {availableActions.map(({ label, href, icon: Icon }) => (
                  <Link key={href} href={href} className="flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#25352B] hover:bg-[#EFF6F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">
                    <Icon aria-hidden="true" size={17} className="text-[#087542]" />{t(label)}
                  </Link>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {loading && <p role="status" className="rounded-lg border border-[#DCE5DF] bg-white p-4 text-sm text-[#52645A]">{t("adminDashboardLoading")}</p>}
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <span>{t("adminDashboardError")}</span>
          <button type="button" onClick={retry} className="min-h-10 rounded-md border border-red-300 px-3 font-semibold hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">{t("retry")}</button>
        </div>
      )}

      {dashboard && !loading && (
        <>
          <section aria-label={t("adminSummaryMetrics")} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {metrics.map(({ label, value, icon, accent }, index) => (
              <AdminDashboardMetricCard
                key={label}
                label={label}
                value={numberFormat.format(value)}
                icon={icon}
                accent={accent}
                className={index === 4 ? "col-span-2 md:col-span-1" : ""}
              />
            ))}
          </section>

          <div className="grid gap-4 lg:grid-cols-3 lg:auto-rows-min">
            <AdminDashboardPanel title={t("adminMemberGrowthTitle")} subtitle={t("adminMemberGrowthSubtitle")} icon={TrendingUp} className="order-1 lg:col-span-1 lg:col-start-1 lg:row-start-1">
              <MemberGrowthChart values={monthlyGrowth} locale={locale} numberFormat={numberFormat} emptyLabel={t("adminNoMemberGrowth")} />
            </AdminDashboardPanel>

            <AdminDashboardPanel title={t("adminProgrammeParticipationTitle")} subtitle={t("adminProgrammeParticipationSubtitle")} icon={GraduationCap} className="order-4 lg:col-span-1 lg:col-start-2 lg:row-start-1">
              {dashboard.programmeParticipation.length === 0 ? (
                <p className="grid min-h-52 place-items-center rounded-lg bg-[#F7FAF8] px-4 text-center text-sm text-[#65736A]">{t("adminNoPublishedProgrammes")}</p>
              ) : (
                <ul className="space-y-3">
                  {dashboard.programmeParticipation.slice(0, 5).map((programme) => {
                    const maximum = Math.max(1, ...dashboard.programmeParticipation.map((item) => item.enrolledParticipants));
                    return (
                      <li key={programme.programmeId} className="border-b border-[#EEF2EF] pb-3 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0 break-words text-sm font-semibold text-[#25352B]">{programme.programmeName}</span>
                          <span className="shrink-0 text-xs font-bold text-[#075C32]">{numberFormat.format(programme.enrolledParticipants)} <span className="font-medium">{t("adminEnrolledShort")}</span></span>
                        </div>
                        <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7ECE9]">
                          <div className="h-full rounded-full bg-[#16864D]" style={{ width: `${(programme.enrolledParticipants / maximum) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                <Info aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
                <p>{t("adminParticipantTargetUnavailable")}</p>
              </div>
            </AdminDashboardPanel>

            <AdminDashboardPanel title={t("adminRecentActivityTitle")} subtitle={t("adminRecentActivitySubtitle")} icon={Clock3} className="order-2 lg:col-span-1 lg:col-start-3 lg:row-start-1">
              {dashboard.recentActivity.length === 0 ? (
                <p className="grid min-h-52 place-items-center rounded-lg bg-[#F7FAF8] px-4 text-center text-sm text-[#65736A]">{t("adminNoRecentActivity")}</p>
              ) : (
                <ul className="space-y-4">
                  {dashboard.recentActivity.map((item) => (
                    <li key={item.id} className="flex gap-3">
                      <span aria-hidden="true" className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EAF3ED] text-[#087542]">
                        {item.kind === "event-created" ? <CalendarDays size={17} /> : item.kind === "resource-created" ? <FileText size={17} /> : <Users size={17} />}
                      </span>
                      <div className="min-w-0">
                        <p className="break-words text-xs font-semibold leading-5 text-[#25352B]">{t(activityLabel(item.kind))}{item.subject ? `: ${item.subject}` : ""}</p>
                        <time dateTime={item.occurredAt} className="mt-1 block text-[11px] text-[#758178]">{dateLabel(item.occurredAt, locale)}</time>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </AdminDashboardPanel>

            <AdminDashboardPanel title={t("adminUpcomingEventsTitle")} subtitle={t("adminUpcomingEventsSubtitle")} icon={CalendarDays} className="order-5 lg:col-span-1 lg:col-start-1 lg:row-start-2">
              {dashboard.upcomingEvents.length === 0 ? (
                <p className="grid min-h-40 place-items-center rounded-lg bg-[#F7FAF8] px-4 text-center text-sm text-[#65736A]">{t("adminNoUpcomingEvents")}</p>
              ) : (
                <ul className="divide-y divide-[#EEF2EF]">
                  {dashboard.upcomingEvents.map((event) => (
                    <li key={event.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <CalendarDays aria-hidden="true" size={19} className="shrink-0 text-[#087542]" />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-[#25352B]">{event.title}</p>
                        <time dateTime={event.startAt} className="mt-1 block text-xs text-[#65736A]">{dateLabel(event.startAt, locale, event.timezone ?? "UTC")}</time>
                        {event.venue && <p className="mt-1 break-words text-xs text-[#65736A]">{event.venue}</p>}
                      </div>
                      <Link href={`/admin/events/${encodeURIComponent(event.id)}`} className="inline-flex min-h-9 shrink-0 items-center rounded-md border border-[#16864D] px-3 text-xs font-semibold text-[#075C32] hover:bg-[#EFF6F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{t("adminViewEvent")}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </AdminDashboardPanel>

            <AdminDashboardPanel title={t("adminMemberAccountStatusTitle")} subtitle={t("adminMemberAccountStatusSubtitle")} icon={UsersRound} className="order-6 lg:col-span-1 lg:col-start-2 lg:row-start-2">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
                <div role="img" aria-label={accountCounts.map(({ status, count }) => `${accountStatusLabel(status, t)}: ${numberFormat.format(count)}`).join(", ")} className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: `conic-gradient(${accountDonut})` }}>
                  <span className="absolute inset-5 grid place-items-center rounded-full bg-white text-center">
                    <span><strong className="block text-2xl text-[#17211B]">{numberFormat.format(accountTotal)}</strong><span className="text-[10px] leading-3 text-[#65736A]">{t("adminMemberAccounts")}</span></span>
                  </span>
                </div>
                <ul className="min-w-0 flex-1 space-y-3">
                  {accountCounts.map(({ status, count }) => (
                    <li key={status} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <span className="flex min-w-0 items-start gap-2 text-xs leading-4 text-[#36453B]"><span aria-hidden="true" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accountStatusColor(status) }} /><span className="min-w-0 break-words">{accountStatusLabel(status, t)}</span></span>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-[#17211B]">{numberFormat.format(count)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AdminDashboardPanel>

            <AdminDashboardPanel title={t("adminQuickActionsTitle")} icon={Zap} className="order-3 lg:col-span-1 lg:col-start-3 lg:row-start-2">
              {availableActions.length === 0 ? (
                <p className="rounded-lg bg-[#F7FAF8] p-4 text-center text-sm text-[#65736A]">{t("adminNoQuickActions")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                  {availableActions.map(({ label, href, icon: Icon }) => (
                    <Link key={href} href={href} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-[#DDEAE1] bg-white px-2 py-3 text-center text-[11px] font-semibold text-[#075C32] hover:bg-[#F3F8F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">
                      <Icon aria-hidden="true" size={20} />
                      <span>{t(label)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </AdminDashboardPanel>
          </div>
        </>
      )}
    </div>
  );
}
