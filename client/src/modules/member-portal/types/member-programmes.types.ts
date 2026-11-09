export type MemberProgrammeView = "enrolled" | "completed" | "available";

export interface MemberProgramme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  cohortName: string | null;
  enrollmentStatus: string | null;
  enrolledAt: string | null;
}
