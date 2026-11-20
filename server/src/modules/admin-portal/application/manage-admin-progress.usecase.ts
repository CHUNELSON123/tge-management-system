import type { AdminProgressRepository, ProgressInput, ProgressPolicyInput } from "../domain/admin-progress.repository.js";

export class ManageAdminProgressUseCase {
  constructor(private readonly repository: AdminProgressRepository) {}
  getPolicy(scope: "programme" | "cohort", id: string) { return this.repository.getPolicy(scope, id); }
  savePolicy(scope: "programme" | "cohort", id: string, input: ProgressPolicyInput, actorId: string) { return this.repository.savePolicy(scope, id, input, actorId); }
  removeOverride(id: string, actorId: string) { return this.repository.removeOverride(id, actorId); }
  getEnrollment(id: string) { return this.repository.getEnrollment(id); }
  saveEnrollment(id: string, input: ProgressInput, actorId: string) { return this.repository.saveEnrollment(id, input, actorId); }
  revokeCompletion(id: string, actorId: string) { return this.repository.revokeCompletion(id, actorId); }
}
