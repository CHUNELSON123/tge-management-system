import type { MemberNotification, MemberNotificationsRepository } from "../domain/member-notifications.repository.js";
export class GetMemberNotificationsUseCase {
  constructor(private readonly repository: MemberNotificationsRepository) {}
  execute(userId: string): Promise<MemberNotification[]> { return this.repository.listForUser(userId); }
  markRead(userId: string, id: string, now = new Date()): Promise<boolean> { return this.repository.markReadForUser(userId, id, now); }
  markAllRead(userId: string, now = new Date()): Promise<number> { return this.repository.markAllReadForUser(userId, now); }
}
