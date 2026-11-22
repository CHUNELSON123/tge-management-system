const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export type Fee = { id: string; name: string; amountMinor: number; currency: string };
export type Registration = { id: string; status: string; reason: string | null; createdAt: string; member: { user: { firstName: string; lastName: string; email: string } }; charge: { amountMinor: number; currency: string; payments: { amountMinor: number }[] } | null };
export type MemberCohort = { id: string; name: string; startDate: string; endDate: string | null; capacity: number | null; enrolledCount: number; full: boolean; open: boolean; enrollmentStatus: string | null; programme: { name: string; description: string | null; durationWeeks: number | null; deliveryMode: string | null }; fee: Fee | null; request: Registration | null };
export type AdminCohort = { id: string; name: string; status: string; startDate: string; capacity: number | null; programmeId: string; registrationFee: { fee: Fee | null } | null; _count: { enrollments: number; registrationRequests: number } };
export type FeeOption = Fee & { active: boolean; category: string; programmeId: string | null; audience: string };
export const token = () => localStorage.getItem("tge.accessToken") || sessionStorage.getItem("tge.accessToken") || "";
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { const response = await fetch(`${API}/api/${path}`, { ...init, headers: { Authorization: `Bearer ${token()}`, ...(init.body ? { "Content-Type": "application/json" } : {}) }, cache: "no-store" }); const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.message || "Registration is unavailable."); return body.data as T; }
export const registrationService = {
  memberCohorts: () => request<MemberCohort[]>("member/foundation/cohorts"),
  apply: (id: string) => request<Registration>(`member/foundation/cohorts/${encodeURIComponent(id)}/requests`, { method: "POST" }),
  cancel: (id: string) => request<unknown>(`member/foundation/requests/${encodeURIComponent(id)}/cancel`, { method: "POST" }),
  adminCohorts: () => request<AdminCohort[]>("admin/foundation/cohorts"),
  requests: (id: string) => request<Registration[]>(`admin/foundation/cohorts/${encodeURIComponent(id)}/requests`),
  fees: () => request<FeeOption[]>("admin/payments/fees"),
  setFee: (id: string, feeId: string | null) => request<unknown>(`admin/foundation/cohorts/${encodeURIComponent(id)}/fee`, { method: "PUT", body: JSON.stringify({ feeId }) }),
  review: (id: string, decision: "approve" | "reject", reason: string | null, feeId?: string | null) => request<unknown>(`admin/foundation/requests/${encodeURIComponent(id)}/review`, { method: "POST", body: JSON.stringify({ decision, reason, ...(feeId !== undefined ? { feeId } : {}) }) }),
};
export const money = (minor: number, currency: string) => new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);
