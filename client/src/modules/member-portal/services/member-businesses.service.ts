import type { MemberBusiness, MemberBusinessCategory, MemberBusinessInput } from "../types/member-businesses.types";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export async function getMemberBusinesses(token: string, signal?: AbortSignal): Promise<MemberBusiness[]> {
  const response = await fetch(`${API_URL}/api/member/businesses`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
  const body = await response.json().catch(() => null) as { message?: string; data?: MemberBusiness[] } | null;
  if (!response.ok || !body?.data) throw Object.assign(new Error(body?.message || "Businesses are unavailable."), { status: response.status });
  return body.data;
}
export async function getMemberBusinessCategories(token: string, signal?: AbortSignal): Promise<MemberBusinessCategory[]> {
  const response = await fetch(`${API_URL}/api/member/businesses/categories`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
  const body = await response.json().catch(() => null) as { message?: string; data?: MemberBusinessCategory[] } | null;
  if (!response.ok || !body?.data) throw new Error(body?.message || "Business categories are unavailable.");
  return body.data;
}
export async function saveMemberBusiness(token: string, input: MemberBusinessInput, id?: string): Promise<MemberBusiness> {
  const response = await fetch(`${API_URL}/api/member/businesses${id ? `/${encodeURIComponent(id)}` : ""}`, { method: id ? "PATCH" : "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify(input) });
  const body = await response.json().catch(() => null) as { message?: string; data?: MemberBusiness } | null;
  if (!response.ok || !body?.data) throw new Error(body?.message || "Business could not be saved.");
  return body.data;
}
