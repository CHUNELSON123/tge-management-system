import type { CohortStatus, EnrollmentStatus, ProgrammeFields, ProgrammeStatus } from "./admin-programmes.repository.js";

const programmeTransitions: Record<ProgrammeStatus, ProgrammeStatus[]> = {
  draft: ["published", "archived"],
  published: ["archived"],
  archived: ["published"],
};

const cohortTransitions: Record<CohortStatus, CohortStatus[]> = {
  planned: ["upcoming", "cancelled", "archived"],
  upcoming: ["ongoing", "cancelled", "archived"],
  ongoing: ["completed", "cancelled", "archived"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

const enrollmentTransitions: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  enrolled: ["completed", "withdrawn"],
  completed: [],
  withdrawn: [],
};

export class InvalidProgrammeTransitionError extends Error {
  constructor(from: string, to: string) { super(`Invalid programme status transition: ${from} -> ${to}`); this.name = "InvalidProgrammeTransitionError"; }
}

export class ProgrammeNotReadyForPublicationError extends Error {
  constructor() {
    super("Complete the required programme details before publishing.");
    this.name = "ProgrammeNotReadyForPublicationError";
  }
}

export class InvalidCohortTransitionError extends Error {
  constructor(from: string, to: string) { super(`Invalid cohort status transition: ${from} -> ${to}`); this.name = "InvalidCohortTransitionError"; }
}

export class InvalidEnrollmentTransitionError extends Error {
  constructor(from: string, to: string) { super(`Invalid enrollment status transition: ${from} -> ${to}`); this.name = "InvalidEnrollmentTransitionError"; }
}

export function canTransitionProgramme(from: ProgrammeStatus, to: ProgrammeStatus) { return programmeTransitions[from]?.includes(to) ?? false; }
export function canTransitionCohort(from: CohortStatus, to: CohortStatus) { return cohortTransitions[from]?.includes(to) ?? false; }
export function canTransitionEnrollment(from: EnrollmentStatus, to: EnrollmentStatus) { return enrollmentTransitions[from]?.includes(to) ?? false; }

export function isProgrammeReadyForPublication(programme: Pick<ProgrammeFields, "description" | "programmeType" | "targetAudience" | "programContent" | "eligibility">) {
  return Boolean(
    programme.description?.trim()
    && programme.programmeType?.trim()
    && programme.targetAudience?.trim()
    && programme.programContent.some((item) => item.trim())
    && programme.eligibility?.trim(),
  );
}
