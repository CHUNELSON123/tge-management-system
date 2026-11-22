import type { AdminAccessResponse } from "../types/admin-access.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const adminAccessService = {
  async getAccess(accessToken: string, signal?: AbortSignal) {
    const response = await fetch(`${API_URL}/api/admin/access`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal,
    });
    let body: unknown;
    try { body = await response.json(); } catch { throw Object.assign(new Error("Administrator access could not be verified."), { status: response.status }); }
    if (!response.ok) {
      const message = body && typeof body === "object" && "message" in body && typeof body.message === "string" ? body.message : "Administrator access could not be verified.";
      throw Object.assign(new Error(message), { status: response.status });
    }
    return (body as AdminAccessResponse).data;
  },
};
