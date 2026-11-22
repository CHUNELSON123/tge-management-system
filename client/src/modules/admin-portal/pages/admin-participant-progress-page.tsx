"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Search,
  UserRound,
  UserX,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAdminParticipantProgress } from "../hooks/use-admin-participant-progress";
import { EnrollmentProgressEditor } from "../components/admin-progress-editors";
import { adminProgrammesService } from "../services/admin-programmes.service";
import type { CohortParticipant } from "../types/admin-programmes.types";

const date = (value: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value))
  : "Not recorded";

const statusLabel = (status: CohortParticipant["status"]) => status === "unrecognized"
  ? "Unrecognized"
  : status === "completed" ? "Completion recorded" : status[0].toUpperCase() + status.slice(1);

const statusStyle = (status: CohortParticipant["status"]) => {
  if (status === "completed") return "bg-emerald-100 text-emerald-800";
  if (status === "enrolled") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
};

const csvCell = (value: string) => `"${(/^[=+@-]/.test(value) ? `'${value}` : value).replaceAll('"', '""')}"`;

type MetricTone = "green" | "blue" | "amber" | "slate";

const metricTone: Record<MetricTone, string> = {
  green: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
  blue: "border-blue-100 bg-blue-50/60 text-blue-600",
  amber: "border-amber-100 bg-amber-50/60 text-amber-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
};

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: MetricTone;
}) {
  return (
    <article className={`flex min-h-[112px] min-w-0 items-center gap-3 rounded-lg border p-4 sm:gap-4 sm:p-5 ${metricTone[tone]}`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/80">
        <Icon aria-hidden="true" className="h-6 w-6" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 text-slate-950">
        <strong className="block break-words text-2xl font-bold leading-tight">{value}</strong>
        <span className="mt-1 block break-words text-sm leading-5 text-[#314F83]">{label}</span>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: CohortParticipant["status"] }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}>
      {statusLabel(status)}
    </span>
  );
}

export function AdminParticipantProgressPage() {
  const vm = useAdminParticipantProgress();
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState("");
  const data = vm.data;
  const currentCohort = vm.cohorts?.rows.find((item) => item.id === vm.selectedCohortId);
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  async function updateEnrollment(enrollmentId: string, status: "completed" | "withdrawn") {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    const action = status === "completed" ? "mark this participant completed" : "withdraw this participant";
    if (!window.confirm(`Are you sure you want to ${action}? This status cannot be reversed.`)) return;
    setBusyId(enrollmentId);
    setMessage("");
    try {
      await adminProgrammesService.transitionEnrollment(token, enrollmentId, status);
      vm.retry();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Enrollment status could not be updated.");
    } finally {
      setBusyId("");
    }
  }

  async function exportReport() {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    if (!token || !vm.selectedCohortId || !data) return;
    setExporting(true);
    setMessage("");
    try {
      const all: CohortParticipant[] = [];
      const pages = Math.ceil(data.total / 50);
      for (let page = 1; page <= pages; page += 1) {
        const result = await adminProgrammesService.participantProgress(token, vm.selectedCohortId, {
          search: vm.filters.search,
          status: vm.filters.status,
          page,
          pageSize: 50,
        });
        all.push(...result.rows);
      }
      const rows = [
        ["Participant", "Email", "Enrollment Status", "Enrolled On", "Completed On"],
        ...all.map((participant) => [
          participant.name,
          participant.email,
          statusLabel(participant.status),
          date(participant.enrolledAt),
          date(participant.completedAt),
        ]),
      ];
      const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const filename = (currentCohort?.name ?? "cohort").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      anchor.href = url;
      anchor.download = `${filename || "cohort"}-participants.csv`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "The participant report could not be exported.");
    } finally {
      setExporting(false);
    }
  }

  const metricValue = (value: number | undefined) => {
    if (vm.failed) return "Unavailable";
    if (vm.loading) return "—";
    return value === undefined ? "—" : new Intl.NumberFormat().format(value);
  };

  return (
    <section className="mx-auto max-w-[1400px]">
      {selectedProgress && <EnrollmentProgressEditor key={selectedProgress} id={selectedProgress} onClose={() => setSelectedProgress("")} onChanged={vm.retry} />}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[#31558F]" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link><ChevronRight aria-hidden="true" size={14} />
        <Link href="/admin" className="hover:underline">Admin</Link><ChevronRight aria-hidden="true" size={14} />
        <Link href="/admin/programmes" className="hover:underline">Programmes &amp; Cohorts</Link><ChevronRight aria-hidden="true" size={14} />
        <span className="font-medium text-[#007A43]">Participant Progress</span>
      </div>

      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">Participant Progress</h1>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-[#31558F]">Record attendance and deliverables, then approve completion for the current requirements.</p>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">Learning milestones and lesson completion are not recorded here.</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:shrink-0">
          <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-700 xl:w-56">
            <span className="sr-only">Programme</span>
            <select
              aria-label="Programme"
              value={vm.selectedProgrammeId}
              onChange={(event) => vm.setSelectedProgrammeId(event.target.value)}
              disabled={vm.loading && !vm.programmes}
              className="min-h-11 min-w-0 rounded-md border border-[#DCE4E0] bg-white px-3 text-sm"
            >
              <option value="">Select Programme</option>
              {vm.programmes?.rows.map((programme) => <option key={programme.id} value={programme.id}>{programme.name}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-1 text-xs font-semibold text-slate-700 xl:w-44">
            <span className="sr-only">Cohort</span>
            <select
              aria-label="Cohort"
              value={vm.selectedCohortId}
              onChange={(event) => vm.setSelectedCohortId(event.target.value)}
              disabled={!vm.selectedProgrammeId || !vm.cohorts?.rows.length}
              className="min-h-11 min-w-0 rounded-md border border-[#DCE4E0] bg-white px-3 text-sm"
            >
              <option value="">Select Cohort</option>
              {vm.cohorts?.rows.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void exportReport()}
            disabled={!data || vm.loading || exporting || data.total === 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#007A43] px-4 text-sm font-semibold text-white hover:bg-[#006638] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 xl:col-span-1"
          >
            <Download aria-hidden="true" size={17} />
            {exporting ? "Preparing Report…" : "Export Report"}
          </button>
        </div>
      </header>

      {message && <p role="alert" className="mt-4 rounded-md bg-rose-50 p-3 text-sm leading-5 text-rose-800">{message}</p>}

      {vm.failed ? (
        <div className="mt-6 rounded-lg border bg-white p-8 text-center">
          <p className="text-sm text-slate-600">Participant data is unavailable right now.</p>
          <button type="button" onClick={vm.retryAll} className="mt-3 text-sm font-semibold text-[#007A43]">Try again</button>
        </div>
      ) : !vm.programmes ? (
        <div className="mt-6 rounded-lg border bg-white p-8 text-center text-sm text-slate-600" role="status">Loading programmes…</div>
      ) : vm.programmes.rows.length === 0 ? (
        <div className="mt-6 rounded-lg border bg-white p-8 text-center text-sm text-slate-600">No programmes are available.</div>
      ) : !vm.selectedProgrammeId ? (
        <div className="mt-6 rounded-lg border bg-white p-8 text-center text-sm text-slate-600">Select a programme to view its cohorts.</div>
      ) : vm.cohorts && vm.cohorts.rows.length === 0 ? (
        <div className="mt-6 rounded-lg border bg-white p-8 text-center text-sm text-slate-600">No cohorts are available for this programme.</div>
      ) : !vm.selectedCohortId ? (
        <div className="mt-6 rounded-lg border bg-white p-8 text-center text-sm text-slate-600" role="status">Select a cohort to view participants.</div>
      ) : (
        <>
          <div className={`mt-5 grid grid-cols-2 gap-3 ${data?.summary.unrecognized ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
            <MetricCard icon={Users} label="Total Participants" value={metricValue(data?.summary.totalParticipants)} tone="green" />
            <MetricCard icon={CheckCircle2} label="Recorded Completions" value={metricValue(data?.summary.completed)} tone="green" />
            <MetricCard icon={UserRound} label="Enrolled" value={metricValue(data?.summary.enrolled)} tone="blue" />
            <MetricCard icon={UserX} label="Withdrawn" value={metricValue(data?.summary.withdrawn)} tone="amber" />
            {Boolean(data?.summary.unrecognized) && <MetricCard icon={UserX} label="Unrecognized Status" value={metricValue(data?.summary.unrecognized)} tone="slate" />}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-b border-[#DDE6E0] sm:flex-row sm:items-end sm:justify-between">
            <div className="border-b-[3px] border-[#007A43] px-2 pb-3 text-sm font-semibold text-[#007A43]">All Participants</div>
            <div className="grid gap-2 pb-3 sm:grid-cols-[minmax(220px,1fr)_190px] sm:pb-2">
              <label className="flex min-h-10 min-w-0 items-center gap-2 rounded-md border border-[#DCE4E0] bg-white px-3">
                <Search aria-hidden="true" size={17} className="shrink-0 text-[#52645A]" />
                <input
                  aria-label="Search participants"
                  placeholder="Search participants…"
                  value={vm.filters.search}
                  onChange={(event) => vm.setFilters({ ...vm.filters, search: event.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                />
              </label>
              <label className="flex min-h-10 items-center gap-2 rounded-md border border-[#DCE4E0] bg-white px-3">
                <Filter aria-hidden="true" size={16} className="shrink-0 text-[#52645A]" />
                <select
                  aria-label="Filter by enrollment status"
                  value={vm.filters.status}
                  onChange={(event) => vm.setFilters({ ...vm.filters, status: event.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="completed">Completed</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </label>
            </div>
          </div>

          <section className="mt-4 overflow-hidden rounded-lg border border-[#E2E9E5] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5ECE7] px-4 py-4 sm:px-5">
              <h2 className="font-bold text-slate-950">All Participants {!vm.loading && data ? `(${data.total})` : ""}</h2>
              <span className="text-xs text-slate-600">{currentCohort?.name ?? "Selected cohort"}</span>
            </div>

            {vm.loading ? (
              <p className="p-10 text-center text-sm text-slate-600" role="status">Loading participant records…</p>
            ) : data?.rows.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[1040px] text-left text-sm">
                    <thead className="bg-[#F3F6F4] text-xs text-[#52645A]">
                      <tr>{["#", "Participant", "Email", "Enrolled On", "Completed On", "Status", "Actions"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
                    </thead>
                    <tbody>
                      {data.rows.map((participant, index) => (
                        <tr key={participant.enrollmentId} className="border-t border-[#EDF1EE] align-middle">
                          <td className="px-4 py-3 text-slate-600">{(vm.page - 1) * data.pageSize + index + 1}</td>
                          <td className="min-w-44 px-4 py-3 font-semibold text-slate-950">{participant.name || "Name not provided"}</td>
                          <td className="min-w-56 break-all px-4 py-3 text-[#31558F]">{participant.email}</td>
                          <td className="whitespace-nowrap px-4 py-3">{date(participant.enrolledAt)}</td>
                          <td className="whitespace-nowrap px-4 py-3">{date(participant.completedAt)}</td>
                          <td className="px-4 py-3"><StatusBadge status={participant.status} />{participant.completionNeedsReview && <span className="mt-1 block text-xs font-semibold text-amber-800">Completion review required</span>}</td>
                          <td className="min-w-44 px-4 py-3">
                            <div className="flex flex-wrap items-center gap-3">
                              {(participant.status === "enrolled" || participant.status === "completed") && vm.canManageEnrollment && <button type="button" onClick={() => setSelectedProgress(participant.enrollmentId)} className="text-xs font-semibold text-[#007A43]">Manage Progress</button>}
                              {participant.status === "enrolled" && vm.canManageEnrollment && <>
                                <button type="button" disabled={busyId === participant.enrollmentId} onClick={() => void updateEnrollment(participant.enrollmentId, "withdrawn")} className="text-xs text-slate-600 disabled:opacity-50">Withdraw</button>
                              </>}
                              {vm.canViewMember && <Link href={`/admin/members/${participant.memberId}`} className="inline-flex min-h-8 items-center rounded border border-[#39A874] px-2.5 text-xs font-semibold text-[#007A43]">View</Link>}
                              {participant.status !== "enrolled" && !vm.canViewMember && <span className="text-slate-400">—</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-[#EDF1EE] md:hidden">
                  {data.rows.map((participant) => (
                    <article key={participant.enrollmentId} className="flex items-start gap-3 p-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-[#007A43]">
                        {participant.status === "completed" ? <CheckCircle2 aria-hidden="true" size={20} /> : participant.status === "withdrawn" ? <UserX aria-hidden="true" size={20} /> : <UserRound aria-hidden="true" size={20} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <strong className="block break-words text-sm leading-5 text-slate-950">{participant.name || "Name not provided"}</strong>
                        <span className="block break-all text-xs leading-5 text-[#31558F]">{participant.email}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-600">Enrolled {date(participant.enrolledAt)}</span>
                        {participant.completedAt && <span className="block text-xs leading-5 text-slate-600">Completed {date(participant.completedAt)}</span>}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge status={participant.status} />
                          {participant.completionNeedsReview && <span className="text-xs font-semibold text-amber-800">Completion review required</span>}
                          {(participant.status === "enrolled" || participant.status === "completed") && vm.canManageEnrollment && <button type="button" onClick={() => setSelectedProgress(participant.enrollmentId)} className="min-h-8 rounded border border-[#39A874] px-2.5 text-xs font-semibold text-[#007A43]">Manage Progress</button>}
                          {participant.status === "enrolled" && vm.canManageEnrollment && <>
                            <button type="button" disabled={busyId === participant.enrollmentId} onClick={() => void updateEnrollment(participant.enrollmentId, "withdrawn")} className="min-h-8 rounded border border-slate-200 px-2.5 text-xs text-slate-600 disabled:opacity-50">Withdraw</button>
                          </>}
                          {vm.canViewMember && <Link href={`/admin/members/${participant.memberId}`} className="min-h-8 rounded px-2 text-xs font-semibold text-[#31558F]">View Member</Link>}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {data.total > data.pageSize && (
                  <div className="flex flex-col gap-3 border-t border-[#EDF1EE] p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <span className="text-slate-600">Showing {(vm.page - 1) * data.pageSize + 1} to {Math.min(vm.page * data.pageSize, data.total)} of {data.total} participants</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button type="button" aria-label="Previous page" disabled={vm.page <= 1} onClick={() => vm.setPage(vm.page - 1)} className="grid h-9 w-9 place-items-center rounded border border-slate-200 disabled:opacity-40"><ChevronLeft aria-hidden="true" size={17} /></button>
                      {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                        <button key={page} type="button" aria-current={vm.page === page ? "page" : undefined} onClick={() => vm.setPage(page)} className={`grid h-9 min-w-9 place-items-center rounded border px-2 ${vm.page === page ? "border-[#007A43] bg-[#007A43] text-white" : "border-slate-200 text-slate-700"}`}>{page}</button>
                      ))}
                      <button type="button" aria-label="Next page" disabled={vm.page >= pageCount} onClick={() => vm.setPage(vm.page + 1)} className="grid h-9 w-9 place-items-center rounded border border-slate-200 disabled:opacity-40"><ChevronRight aria-hidden="true" size={17} /></button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="p-10 text-center text-sm leading-6 text-slate-600">
                {vm.filters.search || vm.filters.status ? "No participants match the selected search and status filters." : "No enrollment records exist for this cohort yet."}
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
