import type {
  AdminDirectMemberInput,
  AdminMemberDetail,
  AdminMemberEnrollment,
  AdminMembersPage,
  AdminMemberProfileUpdate,
  AdminMembershipApplication,
  AdminMembershipApplicationPage,
} from "../types/admin-members.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class AdminMembersRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "AdminMembersRequestError"; }
}

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api/admin${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers as Record<string, string> | undefined) },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as { message?: string; data?: T } | null;
  if (!response.ok || body?.data === undefined) throw new AdminMembersRequestError(body?.message || "Member information is temporarily unavailable.", response.status);
  return body.data;
}

export const adminMembersService = {
  list(token: string, params: Record<string, string | number>, signal?: AbortSignal): Promise<AdminMembersPage> {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "").map(([key, value]) => [key, String(value)]));
    return request(`/members?${query.toString()}`, token, { signal });
  },
  get(token: string, id: string, signal?: AbortSignal): Promise<AdminMemberDetail> { return request(`/members/${encodeURIComponent(id)}`, token, { signal }); },
  programmes(token: string, id: string, signal?: AbortSignal): Promise<AdminMemberEnrollment[]> { return request(`/members/${encodeURIComponent(id)}/programmes`, token, { signal }); },
  async getPhoto(token: string, id: string, signal?: AbortSignal): Promise<Blob | null> {
    const response = await fetch(`${API_URL}/api/admin/members/${encodeURIComponent(id)}/photo`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
    if (response.status === 404) return null;
    if (!response.ok) throw new AdminMembersRequestError("Member profile photo could not be loaded.", response.status);
    return response.blob();
  },
  async updatePhoto(token: string, id: string, photo: File): Promise<void> {
    const response = await fetch(`${API_URL}/api/admin/members/${encodeURIComponent(id)}/photo`, { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": photo.type }, body: photo, cache: "no-store" });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null;
      throw new AdminMembersRequestError(body?.message || "Member profile photo could not be saved.", response.status);
    }
  },
  update(token: string, id: string, input: AdminMemberProfileUpdate): Promise<AdminMemberDetail> {
    return request(`/members/${encodeURIComponent(id)}`, token, { method: "PATCH", body: JSON.stringify(input) });
  },
  register(token: string, input: AdminDirectMemberInput): Promise<{ userId: string; email: string; firstName: string; lastName: string; invitationSent: boolean }> {
    return request("/members", token, { method: "POST", body: JSON.stringify(input) });
  },
  applications(token: string, params: { search: string; page: number; pageSize: number }, signal?: AbortSignal): Promise<AdminMembershipApplicationPage> {
    const query = new URLSearchParams({ search: params.search, page: String(params.page), pageSize: String(params.pageSize) });
    return request(`/members/applications?${query.toString()}`, token, { signal });
  },
  approveApplication(token: string, id: string): Promise<{ userId: string; email: string; firstName: string; lastName: string; invitationSent: boolean }> {
    return request(`/members/applications/${encodeURIComponent(id)}/approve`, token, { method: "POST" });
  },
  rejectApplication(token: string, id: string, reason: string): Promise<AdminMembershipApplication & { notificationSent: boolean }> {
    return request(`/members/applications/${encodeURIComponent(id)}/reject`, token, { method: "POST", body: JSON.stringify({ reason }) });
  },
};
