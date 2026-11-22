import type { AdminMembersFilter, AdminMembersRepository } from "../domain/admin-members.repository.js";

export class GetAdminMembersUseCase {
  constructor(private readonly repository: AdminMembersRepository) {}

  list(filter: AdminMembersFilter) { return this.repository.list(filter); }
  getDetail(memberId: string) { return this.repository.getDetail(memberId); }
  getProgrammes(memberId: string) { return this.repository.getProgrammes(memberId); }
  listPendingApplications(page: number, pageSize: number, search?: string) { return this.repository.listPendingApplications(page, pageSize, search); }
  updateProfile(memberId: string, actorUserId: string, input: Parameters<AdminMembersRepository["updateProfile"]>[2]) {
    return this.repository.updateProfile(memberId, actorUserId, input);
  }
  directRegister(input: Parameters<AdminMembersRepository["directRegister"]>[0], actorUserId: string, passwordHash: string) {
    return this.repository.directRegister(input, actorUserId, passwordHash);
  }
  approveApplication(applicationId: string, actorUserId: string, passwordHash: string) { return this.repository.approveApplication(applicationId, actorUserId, passwordHash); }
  rejectApplication(applicationId: string, actorUserId: string, reason: string) { return this.repository.rejectApplication(applicationId, actorUserId, reason); }
  getProfilePhoto(memberId: string) { return this.repository.getProfilePhoto(memberId); }
  saveProfilePhoto(memberId: string, actorUserId: string, contentType: string, data: Uint8Array) { return this.repository.saveProfilePhoto(memberId, actorUserId, contentType, data); }
}
