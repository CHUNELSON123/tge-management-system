export type ProgrammeStatus = "draft" | "published" | "archived";
export type CohortStatus = "planned" | "upcoming" | "ongoing" | "completed" | "cancelled" | "archived";
export type AssignmentRole = "mentor" | "trainer";
export interface ProgrammeStaffAssignment { id: string; userId: string; name: string; email: string; assignmentRole: string; status: string; assignedAt: string }
export interface AssignableProgrammeStaff { id: string; name: string; email: string; assignmentRole: AssignmentRole }
export interface ProgrammeSummary { totalProgrammes: number; totalCohorts: number; enrolledMembers: number; completedMembers: number }
export interface CohortRow { id: string; programmeId: string; programmeName: string; name: string; startDate: string; endDate: string | null; capacity: number | null; status: CohortStatus; enrolledCount: number; completedCount: number }
export interface ProgrammeRow {
  id: string; code: string | null; name: string; slug: string; description: string | null; programmeType: string | null; targetAudience: string | null;
  durationWeeks: number | null; deliveryMode: string | null; coverImageUrl: string | null; learningObjectives: string[]; programContent: string[]; eligibility: string | null;
  startDate: string | null; endDate: string | null; status: ProgrammeStatus; cohortCount: number; enrolledCount: number; completedCount: number;
}
export interface ProgrammeDetail extends ProgrammeRow { cohorts: CohortRow[]; assignments: ProgrammeStaffAssignment[] }
export interface CohortParticipant { enrollmentId: string; memberId: string; name: string; email: string; phone: string | null; status: "enrolled" | "completed" | "withdrawn" | "unrecognized"; enrolledAt: string; completedAt: string | null; completionNeedsReview: boolean }
export interface CohortDetail extends CohortRow { programmeStatus: ProgrammeStatus; programmeCode: string | null; participants: CohortParticipant[]; assignments: ProgrammeStaffAssignment[] }
export interface ParticipantProgressPage {
  cohort: Pick<CohortDetail, "id" | "programmeId" | "programmeName" | "name" | "status">;
  summary: { totalParticipants: number; enrolled: number; completed: number; withdrawn: number; unrecognized: number };
  rows: CohortParticipant[];
  total: number;
  page: number;
  pageSize: number;
}
export interface ProgrammePage { summary: ProgrammeSummary; rows: ProgrammeRow[]; total: number; page: number; pageSize: number }
export interface CohortPage { summary: ProgrammeSummary; rows: CohortRow[]; total: number; page: number; pageSize: number }
export interface ProgrammeInput { code: string | null; name: string; slug: string; description: string; programmeType: string; targetAudience: string; durationWeeks: number | null; deliveryMode: string | null; coverImageUrl: string | null; learningObjectives: string[]; programContent: string[]; eligibility: string; startDate: string | null; endDate: string | null }
export interface CohortInput { name: string; startDate: string; endDate: string | null; capacity: number | null }
