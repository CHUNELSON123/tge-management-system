export interface CountByStatus { status: string; count: number }
export interface AdminReportsData {
  range: { from: string; to: string; timezone: "UTC" };
  snapshot: { totalUsers: number; memberProfiles: number; activeMemberAccounts: number; publishedProgrammes: number; activeMentorshipAssignments: number; activeApprovedBusinesses: number; publishedEventsInRange: number };
  userRegistrationsByMonth: Array<{ month: string; count: number }>;
  programmeEnrollmentsByMonth: Array<{ month: string; count: number }>;
  programmeCompletionsByMonth: Array<{ month: string; count: number }>;
  memberAccountsByStatus: CountByStatus[];
  memberJoinsByMonth: Array<{ month: string; count: number }>;
  programmesByStatus: CountByStatus[];
  enrollmentsByStatusInRange: CountByStatus[];
  eventsByStatus: CountByStatus[];
  eventRegistrationsByStatusInRange: CountByStatus[];
  mentoringSessionsByStatusInRange: CountByStatus[];
  mentoringObjectivesByStatus: CountByStatus[];
  businessesByStatus: Array<{ operationalStatus: string; publicationStatus: string; count: number }>;
  websiteContentByStatus: Array<{ type: string; status: string; count: number }>;
}
