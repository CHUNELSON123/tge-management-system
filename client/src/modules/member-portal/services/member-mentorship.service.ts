import type { MemberMentorshipData } from "../types/member-mentorship.types";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export async function getMemberMentorship(token: string, signal?: AbortSignal): Promise<MemberMentorshipData> {
  const response = await fetch(`${API_URL}/api/member/mentorship`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
  const body = await response.json().catch(() => null) as { message?: string; data?: MemberMentorshipData } | null;
  if (!response.ok || !body?.data) throw Object.assign(new Error(body?.message || "Mentorship is unavailable."), { status: response.status });
  return body.data;
}
