import type { AssignableProgrammeStaff, AssignmentRole, CohortDetail, CohortInput, CohortPage, ParticipantProgressPage, ProgrammeDetail, ProgrammeInput, ProgrammePage } from "../types/admin-programmes.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export class AdminProgrammesRequestError extends Error { constructor(message: string, readonly status: number) { super(message); this.name = "AdminProgrammesRequestError"; } }
async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api/admin${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers as Record<string, string> | undefined) }, cache: "no-store" });
  const body = await response.json().catch(() => null) as { message?: string; data?: T } | null;
  if (!response.ok || body?.data === undefined) throw new AdminProgrammesRequestError(body?.message || "Programme information is temporarily unavailable.", response.status);
  return body.data;
}
export const adminProgrammesService = {
  async allProgrammes(token: string) { const rows: ProgrammePage["rows"] = []; let page = 1; while (true) { const result = await this.list(token, { page, pageSize: 50 }); rows.push(...result.rows); if (rows.length >= result.total || result.rows.length === 0) return rows; page++; } },
  async allCohorts(token: string) { const rows: CohortPage["rows"] = []; let page = 1; while (true) { const result = await this.cohorts(token, { page, pageSize: 50 }); rows.push(...result.rows); if (rows.length >= result.total || result.rows.length === 0) return rows; page++; } },
  uploadCover(token: string, file: File) { return request<{ url: string }>("/programmes/cover-images", token, { method: "POST", headers: { "Content-Type": file.type }, body: file }); },
  list(token: string, params: Record<string, string | number>, signal?: AbortSignal) { const query = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== "").map(([k,v]) => [k,String(v)])); return request<ProgrammePage>(`/programmes?${query}`, token, { signal }); },
  cohorts(token: string, params: Record<string, string | number>, signal?: AbortSignal) { const query = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== "").map(([k,v]) => [k,String(v)])); return request<CohortPage>(`/cohorts?${query}`, token, { signal }); },
  assignableStaff(token: string, signal?: AbortSignal) { return request<AssignableProgrammeStaff[]>("/assignable-staff", token, { signal }); },
  get(token: string, id: string, signal?: AbortSignal) { return request<ProgrammeDetail>(`/programmes/${encodeURIComponent(id)}`, token, { signal }); },
  getCohort(token: string, id: string, signal?: AbortSignal) { return request<CohortDetail>(`/cohorts/${encodeURIComponent(id)}`, token, { signal }); },
  participantProgress(token: string, cohortId: string, params: Record<string,string|number>, signal?: AbortSignal) { const query=new URLSearchParams(Object.entries(params).filter(([,v])=>v!=="").map(([k,v])=>[k,String(v)]));return request<ParticipantProgressPage>(`/cohorts/${encodeURIComponent(cohortId)}/participants?${query}`,token,{signal}); },
  save(token: string, id: string | null, input: ProgrammeInput) { return request<ProgrammeDetail>(id ? `/programmes/${encodeURIComponent(id)}` : "/programmes", token, { method: id ? "PATCH" : "POST", body: JSON.stringify(input) }); },
  transition(token: string, id: string, status: "published" | "archived") { return request<ProgrammeDetail>(`/programmes/${encodeURIComponent(id)}/status`, token, { method: "POST", body: JSON.stringify({ status }) }); },
  assignProgrammeStaff(token: string, id: string, userId: string, assignmentRole: AssignmentRole) { return request<ProgrammeDetail>(`/programmes/${encodeURIComponent(id)}/assignments`, token, { method: "POST", body: JSON.stringify({ userId, assignmentRole }) }); },
  deactivateProgrammeStaff(token: string, id: string, assignmentId: string) { return request<ProgrammeDetail>(`/programmes/${encodeURIComponent(id)}/assignments/${encodeURIComponent(assignmentId)}/deactivate`, token, { method: "POST" }); },
  createCohort(token: string, id: string, input: CohortInput) { return request<CohortDetail>(`/programmes/${encodeURIComponent(id)}/cohorts`, token, { method: "POST", body: JSON.stringify(input) }); },
  saveCohort(token: string, id: string, input: CohortInput) { return request<CohortDetail>(`/cohorts/${encodeURIComponent(id)}`, token, { method: "PATCH", body: JSON.stringify(input) }); },
  transitionCohort(token: string, id: string, status: "upcoming" | "ongoing" | "completed" | "cancelled" | "archived") { return request<CohortDetail>(`/cohorts/${encodeURIComponent(id)}/status`, token, { method: "POST", body: JSON.stringify({ status }) }); },
  assignCohortStaff(token: string, id: string, userId: string, assignmentRole: AssignmentRole) { return request<CohortDetail>(`/cohorts/${encodeURIComponent(id)}/assignments`, token, { method: "POST", body: JSON.stringify({ userId, assignmentRole }) }); },
  deactivateCohortStaff(token: string, id: string, assignmentId: string) { return request<CohortDetail>(`/cohorts/${encodeURIComponent(id)}/assignments/${encodeURIComponent(assignmentId)}/deactivate`, token, { method: "POST" }); },
  transitionEnrollment(token: string, id: string, status: "completed" | "withdrawn") { return request<CohortDetail>(`/enrollments/${encodeURIComponent(id)}/status`, token, { method: "POST", body: JSON.stringify({ status }) }); },
  enrollMember(token: string, cohortId: string, memberId: string, feeId?: string | null) { return request<unknown>(`/cohorts/${encodeURIComponent(cohortId)}/enrollments`, token, { method: "POST", body: JSON.stringify({ memberId, ...(feeId !== undefined ? { feeId } : {}) }) }); },
};
