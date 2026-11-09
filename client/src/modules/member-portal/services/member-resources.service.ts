import type { MemberResource } from "../types/member-resources.types";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export async function getMemberResources(token: string, signal?: AbortSignal): Promise<MemberResource[]> {
  const response = await fetch(`${API_URL}/api/member/resources`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
  const body = await response.json().catch(() => null) as { message?: string; data?: MemberResource[] } | null;
  if (!response.ok || !body?.data) throw Object.assign(new Error(body?.message || "Resources are unavailable."), { status: response.status });
  return body.data;
}

export class MemberResourceFileError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "MemberResourceFileError"; }
}

async function fetchMemberResourceFile(resourceId: string, download: boolean) {
  const accessToken = localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
  if (!accessToken) throw new MemberResourceFileError("Sign in to access this resource.", 401);
  const response = await fetch(`${API_URL}/api/member/resources/${encodeURIComponent(resourceId)}/file${download ? "?download=1" : ""}`, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
    throw new MemberResourceFileError(body?.message || "Resource file is unavailable.", response.status);
  }
  return { blob: await response.blob(), filename: filenameFromHeader(response.headers.get("Content-Disposition")) };
}

function filenameFromHeader(header: string | null) {
  const encoded = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) { try { return decodeURIComponent(encoded); } catch { /* use the safe fallback */ } }
  const quoted = header?.match(/filename="([^"]+)"/i)?.[1];
  return quoted || "resource";
}

export async function previewMemberResource(resourceId: string) {
  const previewWindow = window.open("about:blank", "_blank");
  if (!previewWindow) throw new MemberResourceFileError("Allow pop-ups to preview this resource.", 0);
  previewWindow.opener = null;
  try {
    const file = await fetchMemberResourceFile(resourceId, false);
    const url = URL.createObjectURL(file.blob);
    previewWindow.location.replace(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    previewWindow.close();
    throw error;
  }
}

export async function downloadMemberResource(resourceId: string) {
  const file = await fetchMemberResourceFile(resourceId, true);
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
