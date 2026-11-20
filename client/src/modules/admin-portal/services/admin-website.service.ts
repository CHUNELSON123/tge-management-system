import type { WebsiteDetail, WebsiteList, WebsiteStatus, WebsiteType } from "../types/admin-website.types";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function collection(type: WebsiteType) { return type === "page" ? "/website/pages" : type === "news" ? "/website/news" : type === "media" ? "/website/media" : `/website/entries/${type}`; }
async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}/api/admin${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}) }, cache: "no-store" });
  const body = await response.json().catch(() => null) as { message?: string; data?: T } | null;
  if (!response.ok || body?.data === undefined) throw new Error(body?.message || "Website content is unavailable.");
  return body.data;
}
export const adminWebsiteService = {
  list(token: string, params: Record<string, string | number>, signal?: AbortSignal) { const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])); return request<WebsiteList>(`/website/content?${query}`, token, { signal }); },
  get(token: string, type: WebsiteType, id: string, signal?: AbortSignal) { return request<WebsiteDetail>(`${collection(type)}/${encodeURIComponent(id)}`, token, { signal }); },
  create(token: string, type: WebsiteType, input: { slug: string; title: string; summary?: string; content: string }) { return request<WebsiteDetail>(collection(type), token, { method: "POST", body: JSON.stringify(input) }); },
  update(token: string, type: WebsiteType, id: string, input: { slug: string; title: string; summary?: string; content: string }) { return request<WebsiteDetail>(`${collection(type)}/${encodeURIComponent(id)}`, token, { method: "PATCH", body: JSON.stringify(input) }); },
  transition(token: string, type: WebsiteType, id: string, status: WebsiteStatus) { return request<WebsiteDetail>(`${collection(type)}/${encodeURIComponent(id)}/status`, token, { method: "POST", body: JSON.stringify({ status }) }); },
  async upload(token: string, file: File): Promise<WebsiteDetail> { const response = await fetch(`${API}/api/admin/website/media`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) }, body: file }); const body = await response.json().catch(() => null) as { message?: string; data?: WebsiteDetail } | null; if (!response.ok || !body?.data) throw new Error(body?.message || "Media upload failed."); return body.data; },
  async mediaFile(token: string, id: string, signal?: AbortSignal): Promise<Blob> { const response = await fetch(`${API}/api/admin/website/media/${encodeURIComponent(id)}/file`, { headers: { Authorization: `Bearer ${token}` }, signal, cache: "no-store" }); if (!response.ok) throw new Error("Media preview unavailable."); return response.blob(); },
};
