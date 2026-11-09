import type { MemberBusiness } from "../types/member-businesses.types";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export async function getMemberBusinesses(token: string, signal?: AbortSignal): Promise<MemberBusiness[]> {
  const response = await fetch(`${API_URL}/api/member/businesses`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
  const body = await response.json().catch(() => null) as { message?: string; data?: MemberBusiness[] } | null;
  if (!response.ok || !body?.data) throw Object.assign(new Error(body?.message || "Businesses are unavailable."), { status: response.status });
  return body.data;
}
