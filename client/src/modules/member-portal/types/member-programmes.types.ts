export type MemberProgrammeView = "enrolled" | "completed" | "available";

export interface MemberProgramme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  cohortId: string | null;
  cohortName: string | null;
  enrollmentStatus: string | null;
  enrolledAt: string | null;
  eligibilityBlock: "FOUNDATION_REQUIRED" | "SECOND_STAGE_REQUIRED" | null;
  progress: { configured: boolean; attendanceMinimum: number | null; attendanceAttended: number | null; attendanceTotal: number | null; deliverables: Array<{ id: string; title: string; completed: boolean }>; requirementsMet: boolean; approvalCurrent: boolean; completionNeedsReview: boolean } | null;
}
