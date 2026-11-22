const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export interface OrganisationSettings { name: string; email: string; phone: string; address: string; allowPublicRegistration: boolean }
export interface SettingsResponse { data: OrganisationSettings; canEdit: boolean }
async function request(token: string, init: RequestInit = {}): Promise<SettingsResponse> {
  const response = await fetch(`${API}/api/admin/settings`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}) }, cache: "no-store" });
  const body = await response.json().catch(() => null) as (SettingsResponse & { message?: string }) | null;
  if (!response.ok || !body?.data) throw new Error(body?.message || "Settings could not be loaded.");
  return body;
}
export const adminSettingsService = {
  get: (token: string, signal?: AbortSignal) => request(token, { signal }),
  save: (token: string, data: OrganisationSettings) => request(token, { method: "PUT", body: JSON.stringify(data) }),
};
