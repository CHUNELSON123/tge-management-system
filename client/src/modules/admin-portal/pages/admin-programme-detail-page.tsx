"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CalendarDays, CheckCircle2, GraduationCap, Users } from "lucide-react";
import { AdminAssignmentManager } from "../components/admin-assignment-manager";
import { ProgressRequirementsEditor } from "../components/admin-progress-editors";
import { useAdminProgrammeForm } from "../hooks/use-admin-programme-form";
import { adminProgrammesService } from "../services/admin-programmes.service";
import { programmeCoverUrl } from "@/lib/programme-cover-url";
import type { CohortStatus } from "../types/admin-programmes.types";

const date = (value: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`))
  : "Date not set";

const cohortStatusClass = (status: CohortStatus) => {
  if (status === "ongoing") return "bg-emerald-100 text-emerald-800";
  if (status === "completed" || status === "cancelled" || status === "archived") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-900";
};

function accessToken() {
  return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
}

export function AdminProgrammeDetailPage({ programmeId }: { programmeId: string }) {
  const vm = useAdminProgrammeForm(programmeId);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCohortForm, setShowCohortForm] = useState(false);
  const [cohortName, setCohortName] = useState("");
  const [cohortStart, setCohortStart] = useState("");
  const [cohortEnd, setCohortEnd] = useState("");
  const [cohortCapacity, setCohortCapacity] = useState("");
  const programme = vm.data;

  async function changeStatus(status: "published" | "archived") {
    const token = accessToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await adminProgrammesService.transition(token, programmeId, status);
      vm.retry();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Programme status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function createCohort(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = accessToken();
    if (!token || !programme) return;
    setBusy(true);
    setError("");
    try {
      await adminProgrammesService.createCohort(token, programme.id, {
        name: cohortName.trim(),
        startDate: cohortStart,
        endDate: cohortEnd || null,
        capacity: cohortCapacity ? Number(cohortCapacity) : null,
      });
      setShowCohortForm(false);
      setCohortName("");
      setCohortStart("");
      setCohortEnd("");
      setCohortCapacity("");
      vm.retry();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cohort could not be created.");
    } finally {
      setBusy(false);
    }
  }

  if (vm.loading) return <p role="status" className="p-8 text-center text-sm text-slate-600">Loading programme…</p>;
  if (!programme) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-sm text-slate-600">{vm.failed ? "Programme information is unavailable." : "Programme was not found."}</p>
        <button type="button" onClick={vm.retry} className="mt-3 text-sm font-semibold text-[#007A43]">Try again</button>
      </div>
    );
  }

  const canEdit = programme.status !== "archived";
  const enrolledAndCompleted = programme.enrolledCount + programme.completedCount;
  const completionRate = enrolledAndCompleted > 0
    ? Math.round(programme.completedCount / enrolledAndCompleted * 100)
    : null;

  return (
    <section className="mx-auto max-w-[1400px]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-words text-2xl font-bold">{programme.name}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${programme.status === "published" ? "bg-emerald-100 text-emerald-800" : programme.status === "archived" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-900"}`}>
              {programme.status === "published" ? "Active" : programme.status[0].toUpperCase() + programme.status.slice(1)}
            </span>
          </div>
          <p className="mt-1 max-w-3xl break-words text-sm leading-6 text-[#52645A]">{programme.description || "Programme description has not been provided."}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:shrink-0">
          {canEdit && <Link href={`/admin/programmes/${programme.id}/edit`} className="inline-flex min-h-10 items-center rounded-md bg-[#007A43] px-4 text-sm font-semibold text-white">Edit Programme</Link>}
          {programme.status === "draft" && <button type="button" disabled={busy} onClick={() => void changeStatus("published")} className="min-h-10 rounded-md border border-[#007A43] px-4 text-sm font-semibold text-[#007A43] disabled:opacity-50">Publish</button>}
          {programme.status === "archived" && <button type="button" disabled={busy} onClick={() => void changeStatus("published")} className="min-h-10 rounded-md border border-[#007A43] px-4 text-sm font-semibold text-[#007A43] disabled:opacity-50">Make Active</button>}
          {canEdit && <button type="button" disabled={busy} onClick={() => void changeStatus("archived")} className="min-h-10 rounded-md border px-4 text-sm disabled:opacity-50">Archive</button>}
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-md bg-rose-50 p-3 text-sm leading-5 text-rose-800">{error}</p>}

      {programme.coverImageUrl && (
        <div className="relative mt-5 h-44 overflow-hidden rounded-lg bg-slate-100 sm:h-64">
          <Image src={programmeCoverUrl(programme.coverImageUrl)} alt="" fill sizes="100vw" unoptimized className="object-cover" />
        </div>
      )}

      {programme.cohorts[0] && (
        <div className="mt-4">
          <Link href={`/admin/programmes/participant-progress?programmeId=${programme.id}&cohortId=${programme.cohorts[0].id}`} className="inline-flex min-h-10 items-center rounded-md border border-[#007A43] px-4 text-sm font-semibold text-[#007A43]">Manage Participants</Link>
        </div>
      )}

      <div className="mt-5"><ProgressRequirementsEditor scope="programme" id={programme.id} disabled={!canEdit} /></div>
      <div className="mt-5">
        <AdminAssignmentManager
          scope="programme"
          parentId={programme.id}
          assignments={programme.assignments}
          disabled={!canEdit}
          onChanged={vm.retry}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          <section className="rounded-lg border bg-white p-4 sm:col-span-2">
            <h2 className="font-bold">Programme Information</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ["Programme Code", programme.code],
                ["Programme Type", programme.programmeType],
                ["Target Audience", programme.targetAudience],
                ["Duration", programme.durationWeeks ? `${programme.durationWeeks} weeks` : null],
                ["Delivery Mode", programme.deliveryMode],
                ["Start Date", programme.startDate ? date(programme.startDate) : null],
                ["End Date", programme.endDate ? date(programme.endDate) : null],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs text-[#65716A]">{label}</dt>
                  <dd className="mt-1 break-words text-sm font-medium">{value || "Not provided"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-lg border bg-white p-4 sm:col-span-2">
            <h2 className="font-bold">Programme Description</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#46564B]">{programme.description || "Programme description has not been provided."}</p>
          </section>

          <section className="rounded-lg border bg-white p-4 sm:col-span-2">
            <h2 className="font-bold">Programme Content</h2>
            {programme.programContent.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {programme.programContent.map((item) => <li key={item} className="flex gap-2 break-words"><CheckCircle2 aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-[#007A43]" />{item}</li>)}
              </ul>
            ) : <p className="mt-3 text-sm text-[#65716A]">No programme content is recorded.</p>}
          </section>

          {programme.learningObjectives.length > 0 && (
            <section className="rounded-lg border bg-white p-4">
              <h2 className="font-bold">Learning Objectives</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {programme.learningObjectives.map((item) => <li key={item} className="flex gap-2 break-words"><CheckCircle2 aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-[#007A43]" />{item}</li>)}
              </ul>
            </section>
          )}

          <section className="rounded-lg border bg-white p-4">
            <h2 className="font-bold">Eligibility</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#46564B]">{programme.eligibility || "Eligibility details have not been provided."}</p>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border bg-white p-4">
            <h2 className="font-bold">Key Statistics</h2>
            <div className="mt-4 space-y-4">
              {[
                [GraduationCap, programme.cohortCount, "Cohorts"],
                [Users, programme.enrolledCount, "Enrolled Members"],
                [CheckCircle2, programme.completedCount, "Completed Members"],
              ].map(([Icon, value, label]) => {
                const MetricIcon = Icon as typeof GraduationCap;
                return (
                  <div key={String(label)} className="flex items-center gap-3">
                    <MetricIcon aria-hidden="true" className="shrink-0 text-[#007A43]" />
                    <div><strong className="block text-xl">{Number(value).toLocaleString()}</strong><span className="text-sm text-[#52645A]">{String(label)}</span></div>
                  </div>
                );
              })}
              {completionRate !== null && <div className="border-t pt-3"><strong className="block text-xl">{completionRate}%</strong><span className="text-sm text-[#52645A]">Completion Rate from persisted enrollments</span></div>}
            </div>
          </section>

          <section className="rounded-lg border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Cohorts</h2>
              {canEdit && <button type="button" onClick={() => setShowCohortForm((current) => !current)} className="min-h-9 rounded px-2 text-sm font-semibold text-[#007A43]">{showCohortForm ? "Cancel" : "+ Add Cohort"}</button>}
            </div>
            {showCohortForm && canEdit && (
              <form onSubmit={(event) => void createCohort(event)} className="mt-4 space-y-3">
                <label className="grid gap-1 text-xs font-semibold">Cohort Name
                  <input required maxLength={150} placeholder="Cohort name" value={cohortName} onChange={(event) => setCohortName(event.target.value)} className="min-h-10 w-full rounded border px-3 text-sm font-normal" />
                </label>
                <label className="grid gap-1 text-xs font-semibold">Start Date
                  <input required type="date" min={programme.startDate ?? undefined} max={programme.endDate ?? undefined} value={cohortStart} onChange={(event) => setCohortStart(event.target.value)} className="min-h-10 w-full rounded border px-3 text-sm font-normal" />
                </label>
                <label className="grid gap-1 text-xs font-semibold">End Date
                  <input type="date" min={cohortStart || programme.startDate || undefined} max={programme.endDate ?? undefined} value={cohortEnd} onChange={(event) => setCohortEnd(event.target.value)} className="min-h-10 w-full rounded border px-3 text-sm font-normal" />
                </label>
                <label className="grid gap-1 text-xs font-semibold">Capacity
                  <input type="number" min="1" max="100000" placeholder="No limit" value={cohortCapacity} onChange={(event) => setCohortCapacity(event.target.value)} className="min-h-10 w-full rounded border px-3 text-sm font-normal" />
                </label>
                <button disabled={busy} className="min-h-10 w-full rounded bg-[#007A43] text-sm font-semibold text-white disabled:opacity-50">{busy ? "Creating…" : "Create Cohort"}</button>
              </form>
            )}
            {programme.cohorts.length ? (
              <div className="mt-3 divide-y">
                {programme.cohorts.map((cohort) => (
                  <div key={cohort.id} className="py-3 first:pt-1">
                    <Link href={`/admin/programmes/${programme.id}/cohorts/${cohort.id}`} className="break-words text-sm font-semibold hover:text-[#007A43]">{cohort.name}</Link>
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-xs leading-5 text-[#52645A]"><CalendarDays aria-hidden="true" size={13} />{date(cohort.startDate)} – {date(cohort.endDate)}</p>
                    <p className="mt-1 break-words text-xs leading-5 text-[#52645A]">{cohort.enrolledCount} enrolled · {cohort.completedCount} completed · <span className={`rounded-full px-2 py-0.5 ${cohortStatusClass(cohort.status)}`}>{cohort.status}</span></p>
                  </div>
                ))}
              </div>
            ) : <p className="mt-4 text-sm leading-5 text-[#65716A]">No cohorts have been created for this programme.</p>}
          </section>
        </aside>
      </div>
    </section>
  );
}
