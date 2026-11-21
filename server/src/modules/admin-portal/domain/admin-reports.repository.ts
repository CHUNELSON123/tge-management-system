export interface AdminReportRange { from: Date; toExclusive: Date }
export interface AdminReportsData {
  range: { from: string; to: string; timezone: "UTC" };
  snapshot: { totalUsers: number; memberProfiles: number; activeMemberAccounts: number; publishedProgrammes: number; activeMentorshipAssignments: number; activeApprovedBusinesses: number; publishedEventsInRange: number };
  userRegistrationsByMonth: Array<{ month: string; count: number }>;
  programmeEnrollmentsByMonth: Array<{ month: string; count: number }>;
  programmeCompletionsByMonth: Array<{ month: string; count: number }>;
  memberAccountsByStatus: Array<{ status: string; count: number }>;
  memberJoinsByMonth: Array<{ month: string; count: number }>;
  programmesByStatus: Array<{ status: string; count: number }>;
  enrollmentsByStatusInRange: Array<{ status: string; count: number }>;
  eventsByStatus: Array<{ status: string; count: number }>;
  eventRegistrationsByStatusInRange: Array<{ status: string; count: number }>;
  mentoringSessionsByStatusInRange: Array<{ status: string; count: number }>;
  mentoringObjectivesByStatus: Array<{ status: string; count: number }>;
  businessesByStatus: Array<{ operationalStatus: string; publicationStatus: string; count: number }>;
  websiteContentByStatus: Array<{ type: string; status: string; count: number }>;
}
export interface AdminReportsRepository { load(range: AdminReportRange): Promise<AdminReportsData>; recordExport(actorId: string, range: AdminReportRange): Promise<void> }
