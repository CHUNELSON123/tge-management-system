export type ProgrammeStatus = "draft" | "published" | "archived";
export type CohortStatus = "planned" | "upcoming" | "ongoing" | "completed" | "cancelled" | "archived";
export type EnrollmentStatus = "enrolled" | "completed" | "withdrawn";
export type AssignmentRole = "mentor" | "trainer";

export interface ProgrammeStaffAssignment {
  id: string;
  userId: string;
  name: string;
  email: string;
  assignmentRole: string;
  status: string;
  assignedAt: string;
}

export interface AssignableProgrammeStaff {
  id: string;
  name: string;
  email: string;
  assignmentRole: AssignmentRole;
}

export interface ProgrammeFields {
  code: string | null;
  name: string;
  slug: string;
  description: string | null;
  programmeType: string | null;
  targetAudience: string | null;
  durationWeeks: number | null;
  deliveryMode: string | null;
  coverImageUrl: string | null;
  learningObjectives: string[];
  programContent: string[];
  eligibility: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ProgrammeSummary {
  totalProgrammes: number;
  totalCohorts: number;
  enrolledMembers: number;
  completedMembers: number;
}

export interface ProgrammeListRow extends ProgrammeFields {
  id: string;
  status: ProgrammeStatus;
  cohortCount: number;
  enrolledCount: number;
  completedCount: number;
}

export interface CohortListRow {
  id: string;
  programmeId: string;
  programmeName: string;
  name: string;
  startDate: string;
  endDate: string | null;
  capacity: number | null;
  status: CohortStatus;
  enrolledCount: number;
  completedCount: number;
}

export interface ProgrammeDetail extends ProgrammeListRow {
  cohorts: CohortListRow[];
  assignments: ProgrammeStaffAssignment[];
}

export interface CohortDetail extends CohortListRow {
  programmeStatus: ProgrammeStatus;
  programmeCode: string | null;
  participants: CohortParticipant[];
  assignments: ProgrammeStaffAssignment[];
}

export interface CohortParticipant {
  enrollmentId: string;
  memberId: string;
  name: string;
  email: string;
  phone: string | null;
  status: EnrollmentStatus | "unrecognized";
  enrolledAt: string;
  completedAt: string | null;
  completionNeedsReview: boolean;
}

export interface ParticipantProgressFilter { search?: string; status?: EnrollmentStatus; page: number; pageSize: number }
export interface ParticipantProgressPage {
  cohort: Pick<CohortDetail, "id" | "programmeId" | "programmeName" | "name" | "status">;
  summary: { totalParticipants: number; enrolled: number; completed: number; withdrawn: number; unrecognized: number };
  rows: CohortParticipant[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminProgrammesPage {
  summary: ProgrammeSummary;
  rows: ProgrammeListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminCohortsPage {
  summary: ProgrammeSummary;
  rows: CohortListRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProgrammeFilter { search?: string; status?: ProgrammeStatus; page: number; pageSize: number }
export interface CohortFilter { search?: string; status?: CohortStatus; programmeId?: string; page: number; pageSize: number }
export interface ProgrammeWrite extends ProgrammeFields {}
export interface CohortWrite { name: string; startDate: string; endDate: string | null; capacity: number | null }

export interface AdminProgrammesRepository {
  listProgrammes(filter: ProgrammeFilter): Promise<AdminProgrammesPage>;
  listCohorts(filter: CohortFilter): Promise<AdminCohortsPage>;
  listAssignableStaff(): Promise<AssignableProgrammeStaff[]>;
  getProgramme(id: string): Promise<ProgrammeDetail | null>;
  createProgramme(input: ProgrammeWrite, actorUserId: string): Promise<ProgrammeDetail>;
  createCoverImage(title: string, contentType: string, data: Uint8Array, actorUserId: string): Promise<string>;
  updateProgramme(id: string, input: ProgrammeWrite, actorUserId: string): Promise<ProgrammeDetail | null>;
  transitionProgramme(id: string, expectedStatus: ProgrammeStatus, status: ProgrammeStatus, actorUserId: string): Promise<ProgrammeDetail | null>;
  assignProgrammeStaff(programmeId: string, userId: string, role: AssignmentRole, actorUserId: string): Promise<ProgrammeDetail | null>;
  deactivateProgrammeStaff(programmeId: string, assignmentId: string, actorUserId: string): Promise<ProgrammeDetail | null>;
  createCohort(programmeId: string, input: CohortWrite, actorUserId: string): Promise<CohortDetail | null>;
  getCohort(id: string): Promise<CohortDetail | null>;
  listParticipantProgress(cohortId: string, filter: ParticipantProgressFilter): Promise<ParticipantProgressPage | null>;
  updateCohort(id: string, input: CohortWrite, actorUserId: string): Promise<CohortDetail | null>;
  transitionCohort(id: string, expectedStatus: CohortStatus, status: CohortStatus, actorUserId: string): Promise<CohortDetail | null>;
  assignCohortStaff(cohortId: string, userId: string, role: AssignmentRole, actorUserId: string): Promise<CohortDetail | null>;
  deactivateCohortStaff(cohortId: string, assignmentId: string, actorUserId: string): Promise<CohortDetail | null>;
  enrollMember(cohortId: string, memberId: string, actorUserId: string, feeId?: string | null): Promise<CohortParticipant>;
  transitionEnrollment(enrollmentId: string, expectedStatus: EnrollmentStatus, status: EnrollmentStatus, actorUserId: string): Promise<CohortParticipant | null>;
  findEnrollment(enrollmentId: string): Promise<{ status: EnrollmentStatus } | null>;
}
