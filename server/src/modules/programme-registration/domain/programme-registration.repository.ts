export interface ProgrammeRegistrationRepository {
  memberCohorts(userId: string): Promise<unknown>;
  request(userId: string, cohortId: string): Promise<unknown>;
  cancel(userId: string, requestId: string): Promise<unknown>;
  adminCohorts(): Promise<unknown>;
  requests(cohortId: string): Promise<unknown>;
  setFee(cohortId: string, feeId: string | null, actorId: string): Promise<unknown>;
  review(requestId: string, decision: "approve" | "reject", reason: string | null, feeId: string | null | undefined, actorId: string): Promise<unknown>;
}
