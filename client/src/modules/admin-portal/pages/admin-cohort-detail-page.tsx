"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, UserRound, UserX, CheckCircle2 } from "lucide-react";
import { AdminAssignmentManager } from "../components/admin-assignment-manager";
import { EnrollmentProgressEditor, ProgressRequirementsEditor } from "../components/admin-progress-editors";
import { useAdminCohort } from "../hooks/use-admin-cohort";
import { adminMembersService } from "../services/admin-members.service";
import { adminProgrammesService } from "../services/admin-programmes.service";
import type { AdminMemberListRecord } from "../types/admin-members.types";
import type { CohortStatus } from "../types/admin-programmes.types";
import { money, registrationService, type FeeOption } from "@/modules/programme-registration/services/registration.service";

const availableTransitions: Record<CohortStatus, CohortStatus[]> = {
  planned: ["upcoming", "cancelled", "archived"],
  upcoming: ["ongoing", "cancelled", "archived"],
  ongoing: ["completed", "cancelled", "archived"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

const date = (value: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`))
  : "Date not set";

const statusClass = (status: CohortStatus) => {
  if (status === "ongoing") return "bg-emerald-100 text-emerald-800";
  if (status === "completed" || status === "cancelled" || status === "archived") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-900";
};

function accessToken() {
  return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
}

export function AdminCohortDetailPage({ cohortId }: { cohortId: string }) {
  const vm = useAdminCohort(cohortId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [members, setMembers] = useState<AdminMemberListRecord[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [foundationFees, setFoundationFees] = useState<FeeOption[]>([]);
  const [memberFee, setMemberFee] = useState("default");
  const [selectedProgress, setSelectedProgress] = useState("");
  const cohort = vm.data;

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = accessToken();
    if (!token || !cohort) return;
    setBusy(true);
    setError("");
    try {
      await adminProgrammesService.saveCohort(token, cohort.id, {
        name: name.trim(),
        startDate: start,
        endDate: end || null,
        capacity: capacity ? Number(capacity) : null,
      });
      setEditing(false);
      vm.retry();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cohort details could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: CohortStatus) {
    const token = accessToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await adminProgrammesService.transitionCohort(token, cohortId, status as Exclude<CohortStatus, "planned">);
      vm.retry();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Cohort status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function updateEnrollment(enrollmentId: string, status: "completed" | "withdrawn") {
    const token = accessToken();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await adminProgrammesService.transitionEnrollment(token, enrollmentId, status);
      vm.retry();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enrollment status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function loadMembers() {
    if (!vm.canAssign) return;
    const token = accessToken();
    if (!token) return;
    setLoadingMembers(true);
    setError("");
    try {
      const result = await adminMembersService.list(token, { status: "active", page: 1, pageSize: 50 });
      const pages = Math.ceil(result.total / result.pageSize);
      const remaining = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, index) => adminMembersService.list(token, { status: "active", page: index + 2, pageSize: 50 })));
      setMembers([result, ...remaining].flatMap(page => page.rows).filter((member) => !cohort?.participants.some((participant) => participant.memberId === member.id)));
      if (cohort?.programmeCode === "TGE-FOUNDATION") setFoundationFees((await registrationService.fees()).filter(fee => fee.active && fee.category === "programme" && fee.programmeId === cohort.programmeId && ["member", "all"].includes(fee.audience)));
      setMembersLoaded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Active members could not be loaded.");
    } finally {
      setLoadingMembers(false);
    }
  }

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = accessToken();
    if (!token || !selectedMember) return;
    setBusy(true);
    setError("");
    try {
      await adminProgrammesService.enrollMember(token, cohortId, selectedMember, cohort?.programmeCode === "TGE-FOUNDATION" && memberFee !== "default" ? memberFee === "free" ? null : memberFee : undefined);
      setSelectedMember("");
      setMembers([]);
      setMembersLoaded(false);
      vm.retry();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Member could not be enrolled.");
    } finally {
      setBusy(false);
    }
  }

  if (vm.loading) return <p role="status" className="p-8 text-center text-sm text-slate-600">Loading cohort…</p>;
  if (!cohort) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-sm text-slate-600">{vm.failed ? "Cohort information is unavailable." : "Cohort was not found."}</p>
        <button type="button" onClick={vm.retry} className="mt-3 text-sm font-semibold text-[#007A43]">Try again</button>
      </div>
    );
  }

  const canEdit = cohort.status !== "archived" && cohort.programmeStatus !== "archived";
  const canEnroll = vm.canAssign
    && cohort.programmeStatus === "published"
    && ["planned", "upcoming", "ongoing"].includes(cohort.status)
    && (cohort.capacity === null || cohort.enrolledCount < cohort.capacity);

  return (
    <section className="mx-auto max-w-5xl">
      <Link href={`/admin/programmes/${cohort.programmeId}`} className="text-sm font-semibold text-[#007A43]">← {cohort.programmeName}</Link>
      <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="break-words text-2xl font-bold">{cohort.name}</h1>
          <p className="mt-1 break-words text-sm text-[#52645A]">{cohort.programmeName}</p>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(cohort.status)}`}>
            {cohort.status}
          </span>
          {cohort.programmeStatus === "archived" && <p className="mt-2 text-xs text-slate-600">This cohort belongs to an archived programme.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/programmes/participant-progress?programmeId=${cohort.programmeId}&cohortId=${cohort.id}`} className="inline-flex min-h-10 items-center rounded border border-[#007A43] px-3 text-sm font-semibold text-[#007A43]">Participant Progress</Link>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setName(cohort.name);
                setStart(cohort.startDate);
                setEnd(cohort.endDate ?? "");
                setCapacity(cohort.capacity?.toString() ?? "");
                setEditing((current) => !current);
              }}
              className="min-h-10 rounded border border-[#007A43] px-4 text-sm font-semibold text-[#007A43]"
            >
              {editing ? "Cancel edit" : "Edit Cohort"}
            </button>
          )}
          {canEdit && availableTransitions[cohort.status].map((status) => (
            <button key={status} type="button" disabled={busy} onClick={() => void changeStatus(status)} className="min-h-10 rounded border px-3 text-sm capitalize disabled:opacity-50">
              {status === "archived" ? "Archive" : status}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded bg-rose-50 p-3 text-sm leading-5 text-rose-800">{error}</p>}

      {editing && canEdit && (
        <form onSubmit={(event) => void save(event)} className="mt-5 grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">Cohort Name
            <input required maxLength={150} value={name} onChange={(event) => setName(event.target.value)} className="min-h-10 rounded border px-3" />
          </label>
          <label className="grid gap-1 text-sm font-medium">Start Date
            <input required type="date" value={start} onChange={(event) => setStart(event.target.value)} className="min-h-10 rounded border px-3" />
          </label>
          <label className="grid gap-1 text-sm font-medium">End Date
            <input type="date" min={start || undefined} value={end} onChange={(event) => setEnd(event.target.value)} className="min-h-10 rounded border px-3" />
          </label>
          <label className="grid gap-1 text-sm font-medium">Capacity
            <input type="number" min="1" max="100000" value={capacity} onChange={(event) => setCapacity(event.target.value)} className="min-h-10 rounded border px-3" placeholder="No limit" />
          </label>
          <button disabled={busy} className="min-h-10 rounded bg-[#007A43] px-4 font-semibold text-white disabled:opacity-50 sm:col-span-2">{busy ? "Saving…" : "Save Cohort"}</button>
        </form>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <article className="rounded-lg border bg-white p-4">
          <strong className="block text-2xl">{cohort.enrolledCount}</strong>
          <span className="text-sm text-[#52645A]">Enrolled Members</span>
        </article>
        <article className="rounded-lg border bg-white p-4">
          <strong className="block text-2xl">{cohort.completedCount}</strong>
          <span className="text-sm text-[#52645A]">Recorded completions</span>
        </article>
        <article className="col-span-2 rounded-lg border bg-white p-4 sm:col-span-1">
          <strong className="flex flex-wrap items-center gap-1 text-base sm:text-lg"><CalendarDays aria-hidden="true" size={17} />{date(cohort.startDate)}{cohort.endDate ? ` – ${date(cohort.endDate)}` : ""}</strong>
          <span className="text-sm text-[#52645A]">Cohort Dates</span>
          {cohort.capacity !== null && <p className="mt-1 text-xs text-slate-600">Capacity: {cohort.capacity}</p>}
        </article>
      </div>

      <div className="mt-5"><ProgressRequirementsEditor scope="cohort" id={cohort.id} disabled={!canEdit} /></div>
      <div className="mt-5">
        <AdminAssignmentManager
          scope="cohort"
          parentId={cohort.id}
          assignments={cohort.assignments}
          disabled={!canEdit}
          onChanged={vm.retry}
        />
      </div>

      {selectedProgress && <EnrollmentProgressEditor key={selectedProgress} id={selectedProgress} onClose={() => setSelectedProgress("")} onChanged={vm.retry} />}
      <section className="mt-5 overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <h2 className="font-bold">Participants ({cohort.participants.length})</h2>
          {canEnroll && (
            <button
              type="button"
              onClick={() => {
                if (membersLoaded) {
                  setMembers([]);
                  setMembersLoaded(false);
                  setSelectedMember("");
                } else {
                  void loadMembers();
                }
              }}
              disabled={loadingMembers}
              className="min-h-9 rounded border border-[#007A43] px-3 text-xs font-semibold text-[#007A43] disabled:opacity-50"
            >
              {loadingMembers ? "Loading members…" : membersLoaded ? "Cancel" : "+ Add Member"}
            </button>
          )}
        </div>

        {cohort.programmeStatus !== "published" && <p className="border-b bg-slate-50 px-4 py-3 text-sm text-slate-600">Enrollment is available after the programme is published.</p>}
        {cohort.programmeCode !== "TGE-FOUNDATION" && <p className="border-b bg-amber-50 px-4 py-3 text-sm text-amber-900">{cohort.programmeCode === "TGE-PERSONALIZED-SUPPORT" ? "Members must complete Foundation and then Young Entrepreneur or The Entrepreneur before mentorship." : "Members must complete TGE Foundation before joining this programme."} Eligibility is checked when you enroll a member.</p>}
        {cohort.capacity !== null && cohort.enrolledCount >= cohort.capacity && <p className="border-b bg-amber-50 px-4 py-3 text-sm text-amber-900">This cohort has reached its enrollment capacity.</p>}

        {membersLoaded && members.length > 0 && (
          <form onSubmit={(event) => void addMember(event)} className="flex flex-col gap-2 border-b bg-[#F8FAF8] p-4 sm:flex-row">
            <label className="sr-only" htmlFor="cohort-member-select">Choose a member to enroll</label>
            <select id="cohort-member-select" required value={selectedMember} onChange={(event) => setSelectedMember(event.target.value)} className="min-h-10 min-w-0 flex-1 rounded border bg-white px-3 text-sm">
              <option value="">Select an active member</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.displayName} · {member.email}</option>)}
            </select>
            {cohort.programmeCode === "TGE-FOUNDATION" && <select aria-label="Contribution for this member" value={memberFee} onChange={event => setMemberFee(event.target.value)} className="min-h-10 rounded border bg-white px-3 text-sm"><option value="default">Use cohort default fee</option><option value="free">Free for this member</option>{foundationFees.map(fee => <option key={fee.id} value={fee.id}>{fee.name} · {money(fee.amountMinor, fee.currency)}</option>)}</select>}
            <button disabled={busy} className="min-h-10 rounded bg-[#007A43] px-4 text-sm font-semibold text-white disabled:opacity-50">Enroll Member</button>
          </form>
        )}
        {membersLoaded && members.length === 0 && <p className="border-b p-4 text-sm text-slate-600">There are no other active members available to enroll.</p>}

        {cohort.participants.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-600">No members are enrolled in this cohort yet.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-[#F3F6F4] text-slate-700">
                  <tr>{["Name", "Email", "Phone", "Status", "Enrolled On", "Actions"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr>
                </thead>
                <tbody>
                  {cohort.participants.map((participant) => (
                    <tr key={participant.enrollmentId} className="border-t align-middle">
                      <td className="px-4 py-3 font-semibold">{participant.name}</td>
                      <td className="break-all px-4 py-3">{participant.email}</td>
                      <td className="px-4 py-3">{participant.phone || "—"}</td>
                      <td className="px-4 py-3 capitalize">{participant.status}{participant.completionNeedsReview && <span className="block text-xs font-semibold normal-case text-amber-800">Completion review required</span>}</td>
                      <td className="px-4 py-3">{date(participant.enrolledAt)}</td>
                      <td className="px-4 py-3">
                        {(participant.status === "enrolled" || participant.status === "completed") && <button type="button" onClick={() => setSelectedProgress(participant.enrollmentId)} className="mr-3 text-xs font-semibold text-[#007A43]">Manage Progress</button>}
                        {participant.status === "enrolled" && (
                          <div className="flex flex-wrap gap-2">
                            <button type="button" disabled={busy} onClick={() => void updateEnrollment(participant.enrollmentId, "withdrawn")} className="text-xs text-slate-600 disabled:opacity-50">Withdraw</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y md:hidden">
              {cohort.participants.map((participant) => (
                <article key={participant.enrollmentId} className="flex items-start gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-[#007A43]">
                    {participant.status === "completed" ? <CheckCircle2 aria-hidden="true" size={19} /> : participant.status === "withdrawn" ? <UserX aria-hidden="true" size={19} /> : <UserRound aria-hidden="true" size={19} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block break-words text-sm">{participant.name}</strong>
                    <span className="block break-all text-xs leading-5 text-slate-600">{participant.email}</span>
                    <span className="mt-1 block text-xs leading-5 capitalize text-slate-600">{participant.status} · {date(participant.enrolledAt)}</span>
                    {participant.completionNeedsReview && <span className="block text-xs font-semibold text-amber-800">Completion review required</span>}
                    {(participant.status === "enrolled" || participant.status === "completed") && <button type="button" onClick={() => setSelectedProgress(participant.enrollmentId)} className="mt-2 text-xs font-semibold text-[#007A43]">Manage Progress</button>}
                    {participant.status === "enrolled" && (
                      <div className="mt-2 flex flex-wrap gap-4">
                        <button type="button" disabled={busy} onClick={() => void updateEnrollment(participant.enrollmentId, "withdrawn")} className="text-xs text-slate-600 disabled:opacity-50">Withdraw</button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </section>
  );
}
