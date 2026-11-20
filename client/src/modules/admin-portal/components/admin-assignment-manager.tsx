"use client";

import { useState } from "react";
import { UserRound, UserPlus, X } from "lucide-react";
import { adminProgrammesService } from "../services/admin-programmes.service";
import type {
  AssignableProgrammeStaff,
  AssignmentRole,
  ProgrammeStaffAssignment,
} from "../types/admin-programmes.types";

type AssignmentScope = "programme" | "cohort";

type AdminAssignmentManagerProps = {
  scope: AssignmentScope;
  parentId: string;
  assignments: ProgrammeStaffAssignment[];
  disabled?: boolean;
  onChanged: () => void;
};

function accessToken() {
  return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "The staff assignment could not be updated.";
  if (message === "ASSIGNEE_NOT_ELIGIBLE") return "Choose an active mentor or trainer account.";
  if (message === "PROGRAMME_ARCHIVED" || message === "COHORT_ARCHIVED") return "Archived programme or cohort assignments cannot be changed.";
  if (message === "ASSIGNMENT_NOT_ACTIVE") return "This staff assignment has already been deactivated.";
  return message;
}

export function AdminAssignmentManager({
  scope,
  parentId,
  assignments,
  disabled = false,
  onChanged,
}: AdminAssignmentManagerProps) {
  const [staff, setStaff] = useState<AssignableProgrammeStaff[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AssignmentRole>("trainer");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");

  const availableStaff = staff.filter((person) =>
    person.assignmentRole === selectedRole
    && !assignments.some((assignment) => assignment.userId === person.id
      && assignment.assignmentRole === selectedRole
      && assignment.status === "active"),
  );

  async function openAssignmentForm() {
    if (isOpen) {
      setIsOpen(false);
      setError("");
      return;
    }
    const token = accessToken();
    if (!token) {
      setError("Your administrator session has expired. Sign in again to continue.");
      return;
    }
    setIsOpen(true);
    setLoadingStaff(true);
    setError("");
    try {
      setStaff(await adminProgrammesService.assignableStaff(token));
    } catch (cause) {
      setError(friendlyError(cause));
    } finally {
      setLoadingStaff(false);
    }
  }

  async function assignStaff(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = accessToken();
    if (!token || !selectedUserId) return;
    setSaving(true);
    setError("");
    try {
      if (scope === "programme") {
        await adminProgrammesService.assignProgrammeStaff(token, parentId, selectedUserId, selectedRole);
      } else {
        await adminProgrammesService.assignCohortStaff(token, parentId, selectedUserId, selectedRole);
      }
      setSelectedUserId("");
      setIsOpen(false);
      onChanged();
    } catch (cause) {
      setError(friendlyError(cause));
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(assignmentId: string) {
    const token = accessToken();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      if (scope === "programme") {
        await adminProgrammesService.deactivateProgrammeStaff(token, parentId, assignmentId);
      } else {
        await adminProgrammesService.deactivateCohortStaff(token, parentId, assignmentId);
      }
      onChanged();
    } catch (cause) {
      setError(friendlyError(cause));
    } finally {
      setSaving(false);
    }
  }

  const title = scope === "programme" ? "Programme team" : "Cohort team";

  return (
    <section className="rounded-lg border border-[#E2E9E5] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">Assign active mentors or trainers to this {scope}.</p>
        </div>
        {!disabled && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void openAssignmentForm()}
            className="inline-flex min-h-9 items-center gap-2 rounded border border-[#39A874] px-3 text-sm font-semibold text-[#007A43] disabled:opacity-50"
          >
            {isOpen ? <X aria-hidden="true" size={16} /> : <UserPlus aria-hidden="true" size={16} />}
            {isOpen ? "Close" : "Assign Staff"}
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-3 rounded bg-rose-50 p-3 text-sm leading-5 text-rose-800">{error}</p>}

      {isOpen && (
        <form onSubmit={(event) => void assignStaff(event)} className="mt-4 grid gap-3 rounded-md bg-[#F7FAF8] p-3 sm:grid-cols-[minmax(140px,0.7fr)_minmax(220px,1.3fr)_auto] sm:items-end">
          <label className="grid gap-1 text-xs font-semibold text-slate-700">
            Assignment role
            <select
              value={selectedRole}
              onChange={(event) => { setSelectedRole(event.target.value as AssignmentRole); setSelectedUserId(""); }}
              className="min-h-10 rounded border border-slate-300 bg-white px-2 text-sm font-normal"
            >
              <option value="trainer">Trainer / Facilitator</option>
              <option value="mentor">Mentor</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-700">
            Staff member
            <select
              required
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              disabled={loadingStaff || availableStaff.length === 0}
              className="min-h-10 rounded border border-slate-300 bg-white px-2 text-sm font-normal disabled:bg-slate-100"
            >
              <option value="">{loadingStaff ? "Loading staff…" : availableStaff.length ? "Select a staff member" : "No active staff in this role"}</option>
              {availableStaff.map((person) => (
                <option key={person.id} value={person.id}>{person.name} · {person.email}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={saving || loadingStaff || !selectedUserId}
            className="min-h-10 rounded bg-[#007A43] px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Assignment"}
          </button>
        </form>
      )}

      {assignments.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-600">
          No staff assignments have been recorded.
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-[#EDF1EE]">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-[#007A43]">
                <UserRound aria-hidden="true" size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-slate-950">{assignment.name || "Unnamed staff account"}</p>
                <p className="break-all text-xs leading-5 text-slate-600">{assignment.email}</p>
              </div>
              <span className="text-xs text-slate-600">
                {assignment.assignmentRole === "trainer" ? "Trainer / Facilitator" : assignment.assignmentRole ? assignment.assignmentRole[0].toUpperCase() + assignment.assignmentRole.slice(1) : "Staff"}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${assignment.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                {assignment.status === "active" ? "Active" : "Inactive"}
              </span>
              <span className="w-full pl-[52px] text-xs leading-5 text-slate-500 sm:w-auto sm:pl-0">
                Assigned {new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(assignment.assignedAt))}
              </span>
              {assignment.status === "active" && !disabled && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void deactivate(assignment.id)}
                  className="min-h-8 rounded px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  Deactivate
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
