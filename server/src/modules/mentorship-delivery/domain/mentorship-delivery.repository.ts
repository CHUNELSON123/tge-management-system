export type DeliveryActor = { userId: string; role: "admin" | "mentor" | "member" };
export type QuarterlyReportInput = { year: number; quarter: number; summary: string; achievements: string; challenges: string; nextSteps: string; reportId?: string };
export interface MentorshipDeliveryRepository {
  detail(assignmentId: string, actor: DeliveryActor): Promise<unknown | null>;
  report(assignmentId: string, actor: DeliveryActor, input: QuarterlyReportInput): Promise<unknown | null>;
  updateSession(sessionId: string, actor: DeliveryActor, status: "completed" | "cancelled", outcome: string | null): Promise<unknown | null>;
  updateObjective(objectiveId: string, actor: DeliveryActor, status: "not_started" | "in_progress" | "completed"): Promise<unknown | null>;
  complete(assignmentId: string, actor: DeliveryActor): Promise<unknown | null>;
}
