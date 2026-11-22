import type { AdminHeaderRepository } from "../domain/admin-header.repository.js";

export class GetAdminHeaderUseCase {
  constructor(private readonly repository: AdminHeaderRepository) {}

  execute(userId: string) {
    return this.repository.loadHeader(userId);
  }

  getProfilePhoto(userId: string) {
    return this.repository.getProfilePhoto(userId);
  }

  markNotificationRead(userId: string, notificationId: string) {
    return this.repository.markNotificationRead(userId, notificationId, new Date());
  }
}
