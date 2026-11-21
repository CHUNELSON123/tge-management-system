import type { AdminBusinessCategory, AdminBusinessDetail, AdminBusinessOwner, AdminBusinessPage } from "../types/admin-businesses.types";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}/api/admin${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers as Record<string, string> | undefined) }, cache: "no-store" });
  const body = await response.json().catch(() => null) as { message?: string; data?: T } | null;
  if (!response.ok || body?.data === undefined) throw new Error(body?.message || "Business information is unavailable.");
  return body.data;
}
export const adminBusinessesService = {
  list(token: string, params: Record<string, string | number>, signal?: AbortSignal) { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "").map(([key, value]) => [key, String(value)])); return request<AdminBusinessPage>(`/businesses?${query}`, token, { signal }); },
  categories(token: string, signal?: AbortSignal) { return request<AdminBusinessCategory[]>("/businesses/categories", token, { signal }); },
  owners(token: string, signal?: AbortSignal) { return request<AdminBusinessOwner[]>("/businesses/owners", token, { signal }); },
  create(token: string, input: { memberId: string; name: string; description: string | null; categoryIds: string[]; address: string | null; websiteUrl: string | null; email: string | null; phone: string | null }) { return request<AdminBusinessDetail>("/businesses", token, { method: "POST", body: JSON.stringify(input) }); },
  update(token: string, id: string, input: { name: string; description: string | null; categoryIds: string[]; address: string | null; websiteUrl: string | null; email: string | null; phone: string | null }) { return request<AdminBusinessDetail>(`/businesses/${encodeURIComponent(id)}`, token, { method: "PATCH", body: JSON.stringify(input) }); },
  get(token: string, id: string, signal?: AbortSignal) { return request<AdminBusinessDetail>(`/businesses/${encodeURIComponent(id)}`, token, { signal }); },
  review(token: string, id: string, status: "approved" | "rejected" | "suspended", reason: string | null) { return request<AdminBusinessDetail>(`/businesses/${encodeURIComponent(id)}/review`, token, { method: "POST", body: JSON.stringify({ status, reason }) }); },
};
