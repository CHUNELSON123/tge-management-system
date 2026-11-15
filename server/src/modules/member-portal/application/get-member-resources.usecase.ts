import type { MemberResource, MemberResourcesRepository } from "../domain/member-resources.repository.js";
export class GetMemberResourcesUseCase {
  constructor(private readonly repository: MemberResourcesRepository) {}
  execute(userId: string, now = new Date()): Promise<MemberResource[] | null> { return this.repository.findForUser(userId, now); }
}
