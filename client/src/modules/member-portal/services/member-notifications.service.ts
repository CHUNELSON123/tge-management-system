import type { MemberNotification } from "../types/member-notifications.types";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
async function patch(path: string, token: string, signal?: AbortSignal) {
  const response = await fetch(`${API_URL}/api/member/notifications${path}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
  if (!response.ok) throw Object.assign(new Error("Notification update failed."), { status: response.status });
}
export async function getMemberNotifications(token: string, signal?: AbortSignal): Promise<MemberNotification[]> {
  const response = await fetch(`${API_URL}/api/member/notifications`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
  const body = await response.json().catch(() => null) as { data?: MemberNotification[]; message?: string } | null;
  if (!response.ok || !body?.data) throw Object.assign(new Error(body?.message || "Notifications unavailable."), { status: response.status });
  return body.data;
}
export const markMemberNotificationRead = (id: string, token: string) => patch(`/${encodeURIComponent(id)}/read`, token);
export const markAllMemberNotificationsRead = (token: string) => patch("/read-all", token);
