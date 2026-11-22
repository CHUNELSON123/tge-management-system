const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export interface ProgressPolicy { id: string; version: number; attendanceMinimum: number | null; deliverables: Array<{ id: string; title: string }> }
export interface PolicyResponse { policy: ProgressPolicy | null; source: "programme" | "cohort" | null; override: boolean }
export interface EnrollmentProgress { id: string; memberName: string; programmeName: string; cohortName: string; enrollmentStatus: string; configured: boolean; scope: "programme" | "cohort" | null; attendanceMinimum: number | null; attendanceAttended: number | null; attendanceTotal: number | null; deliverables: Array<{ id: string; title: string; completed: boolean }>; requirementsMet: boolean; approvalCurrent: boolean }
async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api/admin/progress${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}) }, cache: "no-store" });
  const body = await response.json().catch(() => null) as { data?: T; message?: string } | null;
  if (!response.ok || body?.data === undefined) throw new Error(body?.message ?? "Progress is temporarily unavailable.");
  return body.data;
}
export const adminProgressService = {
  policy(token: string, scope: "programme" | "cohort", id: string) { return request<PolicyResponse>(`/requirements/${scope}/${encodeURIComponent(id)}`, token); },
  savePolicy(token: string, scope: "programme" | "cohort", id: string, input: { attendanceMinimum: number | null; deliverables: Array<{ id: string; title: string }> }) { return request<PolicyResponse>(`/requirements/${scope}/${encodeURIComponent(id)}`, token, { method: "PUT", body: JSON.stringify(input) }); },
  reset(token: string, id: string) { return request<{ reset: boolean }>(`/requirements/cohort/${encodeURIComponent(id)}`, token, { method: "DELETE" }); },
  enrollment(token: string, id: string) { return request<EnrollmentProgress>(`/enrollments/${encodeURIComponent(id)}`, token); },
  saveEnrollment(token: string, id: string, input: { attendanceAttended: number | null; attendanceTotal: number | null; completedDeliverables: string[] }) { return request<EnrollmentProgress>(`/enrollments/${encodeURIComponent(id)}`, token, { method: "PUT", body: JSON.stringify(input) }); },
  revokeCompletion(token: string, id: string) { return request<EnrollmentProgress>(`/enrollments/${encodeURIComponent(id)}/revoke-completion`, token, { method: "POST" }); },
};
