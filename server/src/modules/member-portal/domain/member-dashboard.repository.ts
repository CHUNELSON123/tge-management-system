export interface MemberDashboardIdentity { displayName: string | null; memberId: string | null; enrolledCohorts: Array<{ cohortId: string; programmeId: string }> }
export interface MemberDashboardProgramme { id: string; name: string; cohortName: string; enrolledAt: string }
export interface MemberDashboardEvent { id: string; title: string; eventType: string; startAt: string; endAt: string | null; timezone: string | null; venue: string | null }
export interface MemberDashboardAnnouncement { id: string; title: string; content: string; category: string | null; publishedAt: string }
export interface MemberDashboardRepository {
  findIdentity(userId: string): Promise<MemberDashboardIdentity | null>;
  countEnrolledProgrammes(memberId: string): Promise<number>;
  listEnrolledProgrammes(memberId: string, limit: number): Promise<MemberDashboardProgramme[]>;
  countUpcomingEvents(memberId: string, now: Date): Promise<number>;
  listUpcomingEvents(memberId: string, now: Date, limit: number): Promise<MemberDashboardEvent[]>;
  countUpcomingMentorshipSessions(memberId: string, now: Date): Promise<number>;
  countUnreadNotifications(userId: string): Promise<number>;
  listRecentAnnouncements(input: { memberId: string; roleId: string; cohortIds: string[]; programmeIds: string[]; now: Date; limit: number }): Promise<MemberDashboardAnnouncement[]>;
}
export interface MemberDashboard {
  profile: { displayName: string | null; incomplete: boolean };
  summary: { enrolledProgrammes: number | null; upcomingEvents: number | null; upcomingMentorshipSessions: number | null; certificatesEarned: null };
  unreadNotifications: number | null;
  programmes: MemberDashboardProgramme[];
  upcomingEvents: MemberDashboardEvent[];
  recentAnnouncements: MemberDashboardAnnouncement[];
}
