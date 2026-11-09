import type { MemberCallMedia, MemberCallSignal, MemberConversationDetail, MemberConversationMessage, MemberConversationSummary } from "../types/member-messages.types";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
function token() { return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken") ?? ""; }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api/member${path}`, { ...init, headers: { Authorization: `Bearer ${token()}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers }, cache: "no-store" });
  const body = await response.json().catch(() => null) as { data?: T; message?: string } | null;
  if (!response.ok || body?.data === undefined) throw Object.assign(new Error(body?.message || "Messaging is unavailable."), { status: response.status });
  return body.data;
}
export const listMemberConversations = () => request<MemberConversationSummary[]>("/conversations");
export const getMemberConversation = (id: string) => request<MemberConversationDetail>(`/conversations/${encodeURIComponent(id)}`);
export const sendMemberMessage = (id: string, body: string) => request<MemberConversationMessage>(`/conversations/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify({ body }) });
export const readCallSignals = (conversationId: string, after: number) => request<{ signals: MemberCallSignal[]; cursor: number }>(`/conversations/${encodeURIComponent(conversationId)}/call-signals?after=${after}`);
export const sendCallSignal = (conversationId: string, input: { callId: string; kind: MemberCallSignal["kind"]; media: MemberCallMedia; payload?: Record<string, unknown> | null }) => request<{ signalId: number }>(`/conversations/${encodeURIComponent(conversationId)}/call-signals`, { method: "POST", body: JSON.stringify(input) });
