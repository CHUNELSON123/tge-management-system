import type { Profile, ProfileInput, Work, MentorSession, MentorshipDetail, MentorEvent } from "../types/mentor-portal.types";
const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
  const response = await fetch(`${api}/api/mentor${path}`, { ...init, cache: "no-store", headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}) } });
  const body = await response.json().catch(() => null) as { data?: T; message?: string } | null;
  if (!response.ok || !body?.data) throw new Error(body?.message || "Unable to load mentor information.");
  return body.data;
}
export const mentorPortalService = {
  getWork: () => request<Work>("/assigned-work"),
  getProfile: () => request<Profile>("/profile"),
  async getPhoto() { const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken"); const response = await fetch(`${api}/api/mentor/profile/photo`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }); if (response.status === 404) return null; if (!response.ok) throw new Error("Photo unavailable."); return response.blob(); },
  async savePhoto(file: File) { const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken"); const response = await fetch(`${api}/api/mentor/profile/photo`, { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": file.type }, body: file }); if (!response.ok) throw new Error("Choose a JPG or PNG image up to 2 MB."); },
  getSessions: () => request<MentorSession[]>("/sessions"),
  getEvents: () => request<MentorEvent[]>("/events"),
  getCategories: () => request<{ id: string; name: string }[]>("/resources/categories"),
  async getMentorship(id: string) { const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken"); const response = await fetch(`${api}/api/mentor/mentorship/assignments/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }); const body = await response.json().catch(() => null) as { data?: MentorshipDetail; message?: string } | null; if (!response.ok || !body?.data) throw new Error(body?.message || "Mentorship details unavailable."); return body.data; },
  async addObjective(id: string, title: string) { return mentorshipPost(`/assignments/${encodeURIComponent(id)}/objectives`, { title, description: null, targetDate: null }); },
  async addProgress(id: string, note: string) { return mentorshipPost(`/objectives/${encodeURIComponent(id)}/progress`, { note, value: null }); },
  async uploadResource(file: File, input: { title: string; categoryId: string; targetType: "programme" | "cohort"; targetId: string }) { const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken"); const query = new URLSearchParams(input); const response = await fetch(`${api}/api/mentor/resources/upload?${query}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream", "X-File-Name": encodeURIComponent(file.name) }, body: file }); const body = await response.json().catch(() => null) as { message?: string } | null; if (!response.ok) throw new Error(body?.message || "Resource upload failed."); },
  updateProfile: (input: ProfileInput) => request<Profile>("/profile", { method: "PATCH", body: JSON.stringify(input) }),
  async scheduleSession(assignmentId: string, input: { title: string; scheduledStart: string; scheduledEnd: string | null; locationOrUrl: string | null; notes: string | null }) {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    const response = await fetch(`${api}/api/mentor/mentorship/assignments/${encodeURIComponent(assignmentId)}/sessions`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const body = await response.json().catch(() => null) as { message?: string } | null;
    if (!response.ok) throw new Error(body?.message || "Unable to schedule session.");
  },
  async downloadResource(id: string, title: string) {
    const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
    const response = await fetch(`${api}/api/mentor/resources/${encodeURIComponent(id)}/file`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("Unable to download this resource.");
    const file = await response.blob(); const url = URL.createObjectURL(file); const link = document.createElement("a");
    const disposition = response.headers.get("Content-Disposition") || ""; const match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    try { link.download = match ? decodeURIComponent(match[1]) : title; } catch { link.download = title; }
    link.href = url; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
async function mentorshipPost(path: string, input: object) { const token = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken"); const response = await fetch(`${api}/api/mentor/mentorship${path}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(input) }); const body = await response.json().catch(() => null) as { message?: string } | null; if (!response.ok) throw new Error(body?.message || "Could not save mentorship progress."); }
