"use client";
import { AdminFoundationRegistration } from "@/modules/programme-registration/components/admin-foundation-registration";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  GraduationCap,
  MoreVertical,
  Plus,
  Search,
  Users,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAdminProgrammes } from "../hooks/use-admin-programmes";
import { adminProgrammesService } from "../services/admin-programmes.service";
import { programmeCoverUrl } from "@/lib/programme-cover-url";
import type {
  CohortRow,
  CohortStatus,
  ProgrammeRow,
  ProgrammeStatus,
} from "../types/admin-programmes.types";

const number = (value: number) => new Intl.NumberFormat().format(value);

const formatDate = (value: string | null) => {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
};

const statusLabel = (status: ProgrammeStatus | CohortStatus) =>
  status === "published" ? "Active" : status[0].toUpperCase() + status.slice(1);

const statusClass = (status: ProgrammeStatus | CohortStatus) => {
  if (status === "published" || status === "ongoing") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "archived" || status === "cancelled" || status === "completed") {
    return "bg-slate-100 text-slate-700";
  }
  return "bg-amber-100 text-amber-900";
};

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "blue" | "violet" | "cyan" | "green";
};

const metricTones: Record<MetricCardProps["tone"], string> = {
  blue: "border-blue-100 bg-blue-50/60 text-blue-600",
  violet: "border-violet-100 bg-violet-50/60 text-violet-600",
  cyan: "border-sky-100 bg-sky-50/60 text-sky-600",
  green: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
};

function MetricCard({ icon: Icon, label, value, tone }: MetricCardProps) {
  return (
    <article className={`flex min-h-[122px] items-center gap-4 rounded-lg border p-4 sm:p-5 ${metricTones[tone]}`}>
      <Icon aria-hidden="true" className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" strokeWidth={2.2} />
      <div className="min-w-0 text-slate-950">
        <strong className="block whitespace-nowrap text-xl font-bold leading-none sm:text-2xl">{value}</strong>
        <span className="mt-2 block break-words text-sm leading-5 text-[#314F83]">{label}</span>
      </div>
    </article>
  );
}

function ProgrammeArtwork({ programme }: { programme: ProgrammeRow }) {
  if (programme.coverImageUrl) {
    return (
      <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-md bg-emerald-50 sm:h-14 sm:w-16">
        <Image
          src={programmeCoverUrl(programme.coverImageUrl)}
          alt=""
          fill
          sizes="64px"
          unoptimized
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="grid h-12 w-14 shrink-0 place-items-center rounded-md bg-emerald-50 text-[#007A43] sm:h-14 sm:w-16">
      <BookOpen aria-hidden="true" className="h-6 w-6" />
    </div>
  );
}

function StatusBadge({ status }: { status: ProgrammeStatus | CohortStatus }) {
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

function ProgrammeTableRow({
  programme,
  index,
  canManage,
  busy,
  onTransition,
}: {
  programme: ProgrammeRow;
  index: number;
  canManage: boolean;
  busy: boolean;
  onTransition: (id: string, status: "published" | "archived") => void;
}) {
  const href = `/admin/programmes/${programme.id}`;

  return (
    <tr className="border-t border-[#EDF1EE] align-middle">
      <td className="px-4 py-4 text-slate-600">{index}</td>
      <td className="min-w-56 px-4 py-4">
        <Link href={href} className="flex items-center gap-3 font-semibold text-slate-950 hover:text-[#007A43]">
          <ProgrammeArtwork programme={programme} />
          <span className="break-words">{programme.name}</span>
        </Link>
      </td>
      <td className="max-w-[300px] px-4 py-4 leading-5 text-[#314F83]">
        <p className="whitespace-normal break-words">{programme.description || "Description not provided."}</p>
      </td>
      <td className="px-4 py-4 text-center">{number(programme.cohortCount)}</td>
      <td className="px-4 py-4 text-center">{number(programme.enrolledCount)}</td>
      <td className="px-4 py-4 text-center">{number(programme.completedCount)}</td>
      <td className="px-4 py-4"><StatusBadge status={programme.status} /></td>
      <td className="min-w-44 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href} className="inline-flex min-h-9 items-center rounded border border-[#39A874] px-3 text-xs font-semibold text-[#007A43] hover:bg-emerald-50">
            View
          </Link>
          {canManage && <details className="relative"><summary aria-label={`Actions for ${programme.name}`} className="grid min-h-9 min-w-9 cursor-pointer list-none place-items-center rounded text-[#31558F] hover:bg-slate-100"><MoreVertical size={18} /></summary><div className="absolute right-0 z-10 min-w-36 rounded border bg-white p-1 shadow-lg"><button type="button" disabled={busy} onClick={() => onTransition(programme.id, programme.status === "published" ? "archived" : "published")} className="w-full rounded px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50">{programme.status === "published" ? "Archive" : programme.status === "draft" ? "Publish" : "Make Active"}</button></div></details>}
        </div>
      </td>
    </tr>
  );
}

function CohortTableRow({ cohort, index }: { cohort: CohortRow; index: number }) {
  const href = `/admin/programmes/${cohort.programmeId}/cohorts/${cohort.id}`;

  return (
    <tr className="border-t border-[#EDF1EE] align-middle">
      <td className="px-4 py-4 text-slate-600">{index}</td>
      <td className="min-w-48 px-4 py-4 font-semibold">
        <Link href={href} className="break-words hover:text-[#007A43]">{cohort.name}</Link>
      </td>
      <td className="min-w-48 px-4 py-4 text-[#314F83]">{cohort.programmeName}</td>
      <td className="min-w-44 px-4 py-4 text-[#314F83]">
        <span>{formatDate(cohort.startDate)}</span>
        {cohort.endDate && <span className="block text-xs">through {formatDate(cohort.endDate)}</span>}
      </td>
      <td className="px-4 py-4 text-center">{number(cohort.enrolledCount)}</td>
      <td className="px-4 py-4 text-center">{number(cohort.completedCount)}</td>
      <td className="px-4 py-4"><StatusBadge status={cohort.status} /></td>
      <td className="px-4 py-4">
        <Link href={href} className="inline-flex min-h-9 items-center rounded border border-[#39A874] px-3 text-xs font-semibold text-[#007A43] hover:bg-emerald-50">
          View
        </Link>
      </td>
    </tr>
  );
}

function ProgrammeMobileCard({ programme }: { programme: ProgrammeRow }) {
  const href = `/admin/programmes/${programme.id}`;

  return (
    <article className="flex items-start gap-3 p-4 sm:gap-4">
      <ProgrammeArtwork programme={programme} />
      <div className="min-w-0 flex-1">
        <Link href={href} className="block break-words font-semibold leading-5 text-slate-950 hover:text-[#007A43]">
          {programme.name}
        </Link>
        <p className="mt-1 break-words text-sm leading-5 text-[#314F83]">
          {number(programme.cohortCount)} {programme.cohortCount === 1 ? "cohort" : "cohorts"}
          <span aria-hidden="true"> · </span>
          {number(programme.enrolledCount)} enrolled
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={programme.status} />
        </div>
      </div>
      <Link href={href} aria-label={`View ${programme.name}`} className="mt-1 shrink-0 p-1 text-[#31558F]">
        <ChevronRight aria-hidden="true" size={21} />
      </Link>
    </article>
  );
}

function CohortMobileCard({ cohort }: { cohort: CohortRow }) {
  const href = `/admin/programmes/${cohort.programmeId}/cohorts/${cohort.id}`;

  return (
    <article className="flex items-start gap-3 p-4">
      <div className="grid h-12 w-14 shrink-0 place-items-center rounded-md bg-sky-50 text-sky-600">
        <UserRound aria-hidden="true" className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <Link href={href} className="block break-words font-semibold leading-5 text-slate-950 hover:text-[#007A43]">{cohort.name}</Link>
        <p className="mt-1 break-words text-sm leading-5 text-[#314F83]">{cohort.programmeName}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          {formatDate(cohort.startDate)}{cohort.endDate ? ` – ${formatDate(cohort.endDate)}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={cohort.status} />
          <span className="text-xs text-slate-600">
            {number(cohort.enrolledCount)} enrolled · {number(cohort.completedCount)} completed
          </span>
        </div>
      </div>
      <Link href={href} aria-label={`View ${cohort.name}`} className="mt-1 shrink-0 p-1 text-[#31558F]">
        <ChevronRight aria-hidden="true" size={21} />
      </Link>
    </article>
  );
}

export function AdminProgrammesPage() {
  const vm = useAdminProgrammes();
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const token = () => typeof window === "undefined"
    ? null
    : localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");

  const rows = vm.tab === "programmes"
    ? vm.data?.rows ?? []
    : vm.cohortData?.rows ?? [];
  const total = vm.tab === "programmes"
    ? vm.data?.total ?? 0
    : vm.cohortData?.total ?? 0;
  const summary = vm.tab === "programmes"
    ? vm.data?.summary
    : vm.cohortData?.summary;
  const pageDataAvailable = vm.tab === "programmes" ? vm.data !== null : vm.cohortData !== null;
  const metricValue = (value: number | undefined) => {
    if (vm.failed) return "Unavailable";
    if (vm.loading) return "—";
    if (!pageDataAvailable || value === undefined) return "Unavailable";
    return number(value);
  };
  const pageCount = Math.max(1, Math.ceil(total / 10));

  async function changeStatus(id: string, status: "published" | "archived") {
    const accessToken = token();
    if (!accessToken) return;
    setBusyId(id);
    setMessage("");
    try {
      await adminProgrammesService.transition(accessToken, id, status);
      vm.retry();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "The programme status could not be updated.");
    } finally {
      setBusyId(null);
    }
  }

  function setTab(tab: "programmes" | "cohorts") {
    vm.setTab(tab);
    vm.setPage(1);
  }

  return (
    <section className="mx-auto max-w-[1400px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">Programmes &amp; Cohorts</h1>
          <p className="mt-1 text-sm leading-5 text-[#31558F]">Manage training programmes and their cohorts.</p>
        </div>
        {vm.canManage && (
          <Link href="/admin/programmes/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#007A43] px-4 font-semibold text-white hover:bg-[#006638] sm:shrink-0">
            <Plus aria-hidden="true" size={18} />
            Create Programme
          </Link>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard icon={GraduationCap} label="Total Programmes" value={metricValue(summary?.totalProgrammes)} tone="blue" />
        <MetricCard icon={Users} label="Total Cohorts" value={metricValue(summary?.totalCohorts)} tone="violet" />
        <MetricCard icon={UserRound} label="Enrolled Members" value={metricValue(summary?.enrolledMembers)} tone="cyan" />
        <MetricCard icon={CheckCircle2} label="Recorded Completions" value={metricValue(summary?.completedMembers)} tone="green" />
      </div>

      {vm.canManage && <AdminFoundationRegistration />}

      {message && <p role="alert" className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-800">{message}</p>}

      <div className="mt-6 border-b border-[#DDE6E0] sm:flex sm:items-end sm:justify-between">
        <div className="flex gap-5 sm:gap-7" role="tablist" aria-label="Programme management view">
          <button
            type="button"
            role="tab"
            aria-selected={vm.tab === "programmes"}
            onClick={() => setTab("programmes")}
            className={`min-h-11 border-b-[3px] px-2 text-sm font-semibold ${vm.tab === "programmes" ? "border-[#007A43] text-[#007A43]" : "border-transparent text-[#314F83]"}`}
          >
            Programmes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={vm.tab === "cohorts"}
            onClick={() => setTab("cohorts")}
            className={`min-h-11 border-b-[3px] px-2 text-sm font-semibold ${vm.tab === "cohorts" ? "border-[#007A43] text-[#007A43]" : "border-transparent text-[#314F83]"}`}
          >
            Cohorts
          </button>
        </div>

        <div className="flex gap-2 py-3 sm:items-center sm:pb-2 sm:pt-0">
          <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-[#DCE4E8] bg-white px-3 sm:w-64 sm:flex-none">
            <Search aria-hidden="true" size={17} className="shrink-0 text-[#52645A]" />
            <input
              aria-label={vm.tab === "programmes" ? "Search programmes" : "Search cohorts"}
              placeholder={vm.tab === "programmes" ? "Search programmes…" : "Search cohorts…"}
              value={vm.filters.search}
              onChange={(event) => vm.setFilters({ ...vm.filters, search: event.target.value })}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </label>
          <label className="flex min-h-10 w-36 items-center gap-2 rounded-md border border-[#39A874] bg-white px-3 text-[#007A43] sm:pl-2 sm:pr-3">
            <Filter aria-hidden="true" size={16} className="shrink-0" />
            <select
              aria-label="Filter by status"
              value={vm.filters.status}
              onChange={(event) => vm.setFilters({ ...vm.filters, status: event.target.value })}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
            >
              <option value="">All Statuses</option>
              {(vm.tab === "programmes"
                ? ["draft", "published", "archived"]
                : ["planned", "upcoming", "ongoing", "completed", "cancelled", "archived"]
              ).map((status) => (
                <option key={status} value={status}>{statusLabel(status as ProgrammeStatus | CohortStatus)}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-lg border border-[#E2E9E5] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5ECE7] px-4 py-4 sm:px-5">
          <h2 className="font-bold text-slate-950">
            {vm.tab === "programmes" ? "Programmes" : "Cohorts"} ({vm.loading && !pageDataAvailable ? "…" : number(total)})
          </h2>
          {vm.tab === "cohorts" && <span className="text-xs leading-5 text-slate-600">Open a programme to create and manage its cohorts.</span>}
        </div>

        {vm.loading ? (
          <div className="p-10 text-center text-sm text-slate-600" role="status">Loading {vm.tab}…</div>
        ) : vm.failed ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-600">{vm.tab === "programmes" ? "Programme" : "Cohort"} information is unavailable right now.</p>
            <button type="button" onClick={vm.retry} className="mt-3 text-sm font-semibold text-[#007A43]">Try again</button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm leading-6 text-slate-600">
            {vm.filters.search || vm.filters.status
              ? `No ${vm.tab} match the selected search and status filters.`
              : vm.tab === "programmes"
                ? "No programmes have been created yet."
                : "No cohorts have been created yet."}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="bg-[#F3F6F4] text-xs text-[#52645A]">
                  <tr>
                    {(vm.tab === "programmes"
                      ? ["#", "Programme Name", "Description", "Cohorts", "Enrolled", "Completed", "Status", "Actions"]
                      : ["#", "Cohort", "Programme", "Dates", "Enrolled", "Completed", "Status", "Actions"]
                    ).map((column) => <th key={column} className="px-4 py-3 font-semibold">{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {vm.tab === "programmes"
                    ? (rows as ProgrammeRow[]).map((programme, index) => (
                      <ProgrammeTableRow
                        key={programme.id}
                        programme={programme}
                        index={(vm.page - 1) * 10 + index + 1}
                        canManage={vm.canManage}
                        busy={busyId === programme.id}
                        onTransition={(id, status) => void changeStatus(id, status)}
                      />
                    ))
                    : (rows as CohortRow[]).map((cohort, index) => (
                      <CohortTableRow key={cohort.id} cohort={cohort} index={(vm.page - 1) * 10 + index + 1} />
                    ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#EDF1EE] md:hidden">
              {vm.tab === "programmes"
                ? (rows as ProgrammeRow[]).map((programme) => (
                  <ProgrammeMobileCard
                    key={programme.id}
                    programme={programme}
                  />
                ))
                : (rows as CohortRow[]).map((cohort) => <CohortMobileCard key={cohort.id} cohort={cohort} />)}
            </div>

            {total > 10 && (
              <div className="flex flex-col gap-3 border-t border-[#EDF1EE] p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <span className="text-slate-600">Showing {(vm.page - 1) * 10 + 1} to {Math.min(vm.page * 10, total)} of {number(total)} {vm.tab}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={vm.page <= 1}
                    onClick={() => vm.setPage(vm.page - 1)}
                    className="grid h-9 w-9 place-items-center rounded border border-slate-200 text-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft aria-hidden="true" size={17} />
                  </button>
                  <span aria-live="polite" className="min-w-16 text-center">Page {vm.page} of {pageCount}</span>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={vm.page >= pageCount}
                    onClick={() => vm.setPage(vm.page + 1)}
                    className="grid h-9 w-9 place-items-center rounded border border-slate-200 text-slate-700 disabled:opacity-40"
                  >
                    <ChevronRight aria-hidden="true" size={17} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}
