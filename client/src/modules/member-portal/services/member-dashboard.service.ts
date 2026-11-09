export interface MemberDashboardProgramme {
  id: string;
  name: string;
  cohortName: string;
  enrolledAt: string;
}

export interface MemberDashboardEvent {
  id: string;
  title: string;
  eventType: string;
  startAt: string;
  endAt: string | null;
  timezone: string | null;
  venue: string | null;
}

export interface MemberDashboardAnnouncement {
  id: string;
  title: string;
  content: string;
  category: string | null;
  publishedAt: string;
}

export interface MemberDashboard {
  profile: { displayName: string | null; incomplete: boolean };
  summary: {
    enrolledProgrammes: number | null;
    upcomingEvents: number | null;
    upcomingMentorshipSessions: number | null;
    certificatesEarned: number | null;
  };
  unreadNotifications: number | null;
  programmes: MemberDashboardProgramme[];
  upcomingEvents: MemberDashboardEvent[];
  recentAnnouncements: MemberDashboardAnnouncement[];
}

export class MemberDashboardRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "MemberDashboardRequestError";
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const memberDashboardService = {
  async getDashboard(accessToken: string, signal?: AbortSignal): Promise<MemberDashboard> {
    const response = await fetch(`${API_URL}/api/member/dashboard`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal,
    });
    const body = await response.json().catch(() => null) as { message?: string; data?: MemberDashboard } | null;
    if (!response.ok || !body?.data) {
      throw new MemberDashboardRequestError(body?.message || "Member dashboard is temporarily unavailable.", response.status);
    }
    return body.data;
  },
};
