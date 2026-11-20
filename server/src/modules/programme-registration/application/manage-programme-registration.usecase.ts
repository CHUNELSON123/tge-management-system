import type { ProgrammeRegistrationRepository } from "../domain/programme-registration.repository.js";
export class ManageProgrammeRegistration {
  constructor(private readonly repository: ProgrammeRegistrationRepository) {}
  memberCohorts(userId: string) { return this.repository.memberCohorts(userId); }
  request(userId: string, cohortId: string) { return this.repository.request(userId, cohortId); }
  cancel(userId: string, requestId: string) { return this.repository.cancel(userId, requestId); }
  adminCohorts() { return this.repository.adminCohorts(); }
  requests(cohortId: string) { return this.repository.requests(cohortId); }
  setFee(cohortId: string, feeId: string | null, actorId: string) { return this.repository.setFee(cohortId, feeId, actorId); }
  review(requestId: string, decision: "approve" | "reject", reason: string | null, feeId: string | null | undefined, actorId: string) { return this.repository.review(requestId, decision, reason, feeId, actorId); }
}
