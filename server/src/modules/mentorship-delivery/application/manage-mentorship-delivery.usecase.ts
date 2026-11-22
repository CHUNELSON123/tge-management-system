import type { DeliveryActor, MentorshipDeliveryRepository, QuarterlyReportInput } from "../domain/mentorship-delivery.repository.js";
export class ManageMentorshipDelivery {
  constructor(private readonly repository: MentorshipDeliveryRepository) {}
  detail(id: string, actor: DeliveryActor) { return this.repository.detail(id, actor); }
  report(id: string, actor: DeliveryActor, input: QuarterlyReportInput) { return this.repository.report(id, actor, input); }
  updateSession(id: string, actor: DeliveryActor, status: "completed" | "cancelled", outcome: string | null) { return this.repository.updateSession(id, actor, status, outcome); }
  updateObjective(id: string, actor: DeliveryActor, status: "not_started" | "in_progress" | "completed") { return this.repository.updateObjective(id, actor, status); }
  complete(id: string, actor: DeliveryActor) { return this.repository.complete(id, actor); }
}
