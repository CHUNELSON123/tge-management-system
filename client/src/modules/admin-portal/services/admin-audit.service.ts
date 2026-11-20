import type { AuditPage } from "../types/admin-audit.types";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
async function get<T>(path: string, token: string, signal?: AbortSignal): Promise<T> { const response = await fetch(`${API}/api/admin${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal }); const body = await response.json().catch(() => null) as { message?: string; data?: T } | null; if (!response.ok || body?.data === undefined) throw new Error(body?.message || "Audit logs are unavailable."); return body.data; }
export const adminAuditService = {
  list(token: string, params: Record<string, string | number>, signal?: AbortSignal) { const query = new URLSearchParams(Object.entries(params).map(([k,v]) => [k, String(v)])); return get<AuditPage>(`/audit-logs?${query}`, token, signal); },
  actors(token: string, signal?: AbortSignal) { return get<Array<{ id: string; name: string }>>("/audit-logs/actors", token, signal); },
};
