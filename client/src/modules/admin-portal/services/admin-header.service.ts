import type { AdminHeaderData } from "../types/admin-header.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const adminHeaderService = {
  async getHeader(token: string, signal?: AbortSignal): Promise<AdminHeaderData> {
    const response = await fetch(`${API_URL}/api/admin/header`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
    const body = await response.json().catch(() => null) as { message?: string; data?: AdminHeaderData } | null;
    if (!response.ok || !body?.data) throw Object.assign(new Error(body?.message || "Administrator notifications are unavailable."), { status: response.status });
    return body.data;
  },
  async getPhoto(token: string, signal?: AbortSignal): Promise<Blob | null> {
    const response = await fetch(`${API_URL}/api/admin/profile-photo`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
    if (response.status === 404) return null;
    if (!response.ok) throw Object.assign(new Error("Administrator profile photo could not be loaded."), { status: response.status });
    return response.blob();
  },
  async markRead(token: string, id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) throw Object.assign(new Error("The notification could not be updated."), { status: response.status });
  },
};
