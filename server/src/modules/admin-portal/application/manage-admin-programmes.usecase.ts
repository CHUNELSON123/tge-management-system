import type {
  AdminProgrammesRepository,
  AssignmentRole,
  CohortFilter,
  CohortStatus,
  CohortWrite,
  EnrollmentStatus,
  ProgrammeFilter,
  ProgrammeStatus,
  ProgrammeWrite,
} from "../domain/admin-programmes.repository.js";
import {
  canTransitionCohort,
  canTransitionEnrollment,
  canTransitionProgramme,
  isProgrammeReadyForPublication,
  InvalidCohortTransitionError,
  InvalidEnrollmentTransitionError,
  InvalidProgrammeTransitionError,
  ProgrammeNotReadyForPublicationError,
} from "../domain/programme-lifecycle.js";

export class ManageAdminProgrammesUseCase {
  constructor(private readonly repository: AdminProgrammesRepository) {}

  listProgrammes(filter: ProgrammeFilter) { return this.repository.listProgrammes(filter); }
  listCohorts(filter: CohortFilter) { return this.repository.listCohorts(filter); }
  listAssignableStaff() { return this.repository.listAssignableStaff(); }
  createCoverImage(title: string, contentType: string, data: Uint8Array, actorUserId: string) { return this.repository.createCoverImage(title, contentType, data, actorUserId); }
  getProgramme(id: string) { return this.repository.getProgramme(id); }
  createProgramme(input: ProgrammeWrite, actorUserId: string) {
    if (!isProgrammeReadyForPublication(input)) throw new ProgrammeNotReadyForPublicationError();
    return this.repository.createProgramme(input, actorUserId);
  }
  updateProgramme(id: string, input: ProgrammeWrite, actorUserId: string) { return this.repository.updateProgramme(id, input, actorUserId); }
  assignProgrammeStaff(id: string, userId: string, role: AssignmentRole, actorUserId: string) { return this.repository.assignProgrammeStaff(id, userId, role, actorUserId); }
  deactivateProgrammeStaff(id: string, assignmentId: string, actorUserId: string) { return this.repository.deactivateProgrammeStaff(id, assignmentId, actorUserId); }
  getCohort(id: string) { return this.repository.getCohort(id); }
  listParticipantProgress(cohortId: string, filter: Parameters<AdminProgrammesRepository["listParticipantProgress"]>[1]) { return this.repository.listParticipantProgress(cohortId, filter); }
  createCohort(programmeId: string, input: CohortWrite, actorUserId: string) { return this.repository.createCohort(programmeId, input, actorUserId); }
  updateCohort(id: string, input: CohortWrite, actorUserId: string) { return this.repository.updateCohort(id, input, actorUserId); }
  assignCohortStaff(id: string, userId: string, role: AssignmentRole, actorUserId: string) { return this.repository.assignCohortStaff(id, userId, role, actorUserId); }
  deactivateCohortStaff(id: string, assignmentId: string, actorUserId: string) { return this.repository.deactivateCohortStaff(id, assignmentId, actorUserId); }
  enrollMember(cohortId: string, memberId: string, actorUserId: string, feeId?: string | null) { return this.repository.enrollMember(cohortId, memberId, actorUserId, feeId); }

  async transitionProgramme(id: string, next: ProgrammeStatus, actorUserId: string) {
    const current = await this.repository.getProgramme(id);
    if (!current) return null;
    if (!canTransitionProgramme(current.status, next)) throw new InvalidProgrammeTransitionError(current.status, next);
    if (next === "published" && !isProgrammeReadyForPublication(current)) throw new ProgrammeNotReadyForPublicationError();
    return this.repository.transitionProgramme(id, current.status, next, actorUserId);
  }

  async transitionCohort(id: string, next: CohortStatus, actorUserId: string) {
    const current = await this.repository.getCohort(id);
    if (!current) return null;
    if (!canTransitionCohort(current.status, next)) throw new InvalidCohortTransitionError(current.status, next);
    return this.repository.transitionCohort(id, current.status, next, actorUserId);
  }

  async transitionEnrollment(id: string, next: EnrollmentStatus, actorUserId: string) {
    const current = await this.repository.findEnrollment(id);
    if (!current) return null;
    if (!(current.status === "completed" && next === "completed") && !canTransitionEnrollment(current.status, next)) throw new InvalidEnrollmentTransitionError(current.status, next);
    return this.repository.transitionEnrollment(id, current.status, next, actorUserId);
  }
}
