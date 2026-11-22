import type { MemberCallMedia, MemberCallSignal, MemberConversationDetail, MemberConversationMessage, MemberConversationSummary } from "../types/member-messages.types";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function token() { return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken") ?? ""; }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api/messaging${path}`, { ...init, headers: { Authorization: `Bearer ${token()}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers }, cache: "no-store" });
  const body = await response.json().catch(() => null) as { data?: T; message?: string } | null;
  if (!response.ok || body?.data === undefined) throw Object.assign(new Error(body?.message || "Messaging is unavailable."), { status: response.status });
  return body.data;
}
export const listMemberConversations = () => request<MemberConversationSummary[]>("/conversations");
export const getIncomingCall = () => request<{ call: { conversationId: string; fromUserId: string } | null }>("/incoming-call");
export const updatePresence = () => request<{ success: boolean }>("/presence", { method: "POST" });
export const getConversationPresence = (id: string) => request<{ online: boolean }>(`/conversations/${encodeURIComponent(id)}/presence`);
export const searchMessageContacts = (q: string) => request<{ id: string; firstName: string; lastName: string; role: { name: string } }[]>(`/contacts?q=${encodeURIComponent(q)}`);
export const startMessageConversation = (recipientId: string) => request<{ id: string }>("/conversations", { method: "POST", body: JSON.stringify({ recipientId }) });
export const getMemberConversation = (id: string) => request<MemberConversationDetail>(`/conversations/${encodeURIComponent(id)}`);
export const markConversationRead = (id: string, messageId: string) => request<{ success: boolean }>(`/conversations/${encodeURIComponent(id)}/read`, { method: "PATCH", body: JSON.stringify({ messageId }) });
export const sendMemberMessage = (id: string, body: string) => request<MemberConversationMessage>(`/conversations/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify({ body }) });
export async function uploadChatDocument(id: string, file: File) {
  const response = await fetch(`${API_URL}/api/messaging/conversations/${encodeURIComponent(id)}/attachments`, { method: "POST", headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/octet-stream", "X-File-Name": encodeURIComponent(file.name) }, body: file });
  if (!response.ok) { const result = await response.json().catch(() => null) as { message?: string } | null; throw new Error(result?.message || "Document could not be uploaded."); }
}
export async function downloadChatDocument(id: string, filename: string) {
  const response = await fetch(`${API_URL}/api/messaging/attachments/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token()}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Document could not be downloaded.");
  const url = URL.createObjectURL(await response.blob()); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const readCallSignals = (conversationId: string, after: number) => request<{ signals: MemberCallSignal[]; cursor: number }>(`/conversations/${encodeURIComponent(conversationId)}/call-signals?after=${after}`);
export const sendCallSignal = (conversationId: string, input: { callId: string; kind: MemberCallSignal["kind"]; media: MemberCallMedia; payload?: Record<string, unknown> | null }) => request<{ signalId: number }>(`/conversations/${encodeURIComponent(conversationId)}/call-signals`, { method: "POST", body: JSON.stringify(input) });
