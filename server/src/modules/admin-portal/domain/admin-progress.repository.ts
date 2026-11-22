import type { RequirementItem } from "../../programme-progression/progress-policy.js";

export interface ProgressPolicyInput { attendanceMinimum: number | null; deliverables: RequirementItem[] }
export interface ProgressInput { attendanceAttended: number | null; attendanceTotal: number | null; completedDeliverables: string[] }
export interface AdminProgressRepository {
  getPolicy(scope: "programme" | "cohort", id: string): Promise<unknown | null>;
  savePolicy(scope: "programme" | "cohort", id: string, input: ProgressPolicyInput, actorId: string): Promise<unknown | null>;
  removeOverride(id: string, actorId: string): Promise<boolean>;
  getEnrollment(id: string): Promise<unknown | null>;
  saveEnrollment(id: string, input: ProgressInput, actorId: string): Promise<unknown | null>;
  revokeCompletion(id: string, actorId: string): Promise<unknown | null>;
}
