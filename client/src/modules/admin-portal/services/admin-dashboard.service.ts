import type { AdminDashboard } from "../types/admin-dashboard.types";
import { AdminDashboardRequestError as RequestError } from "../types/admin-dashboard.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const adminDashboardService = {
  async getDashboard(accessToken: string, range: { from: string; to: string }, signal?: AbortSignal): Promise<AdminDashboard> {
    const query = new URLSearchParams(range);
    const response = await fetch(`${API_URL}/api/admin/dashboard?${query.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal,
    });
    const body = await response.json().catch(() => null) as { message?: string; data?: AdminDashboard } | null;
    if (!response.ok || !body?.data) {
      throw new RequestError(body?.message || "The admin dashboard is temporarily unavailable.", response.status);
    }
    return body.data;
  },
};
