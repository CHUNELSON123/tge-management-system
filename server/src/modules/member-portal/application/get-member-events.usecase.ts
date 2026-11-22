import type { MemberEventDetails, MemberEventRecord, MemberEventsRepository } from "../domain/member-events.repository.js";

export class GetMemberEventsUseCase {
  constructor(private readonly repository: MemberEventsRepository) {}

  execute(userId: string): Promise<MemberEventRecord[] | null> {
    return this.repository.listForMember(userId);
  }

  getDetails(userId: string, eventId: string, now = new Date()): Promise<MemberEventDetails | null> {
    return this.repository.findAccessibleEvent(userId, eventId, now);
  }
}
