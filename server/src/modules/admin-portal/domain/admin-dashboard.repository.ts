export interface AdminDashboardDateRange {
  from: Date;
  toExclusive: Date;
}

export interface AdminDashboardData {
  dateRange: { from: string; to: string };
  summary: {
    totalMemberProfiles: number;
    publishedProgrammes: number;
    activeMentorsAndTrainers: number;
    publishedEventsInRange: number;
    publiclyListedBusinesses: number;
  };
  memberCountsByStatus: Array<{ status: string; count: number }>;
  memberGrowth: Array<{ month: string; joined: number }>;
  programmeParticipation: Array<{ programmeId: string; programmeName: string; enrolledParticipants: number }>;
  recentActivity: Array<{ id: string; kind: string; subject: string | null; occurredAt: string }>;
  upcomingEvents: Array<{ id: string; title: string; startAt: string; timezone: string | null; venue: string | null }>;
}

export interface AdminDashboardRepository {
  loadDashboard(range: AdminDashboardDateRange): Promise<AdminDashboardData>;
}
