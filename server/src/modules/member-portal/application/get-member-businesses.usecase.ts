import type { MemberBusiness, MemberBusinessesRepository } from "../domain/member-businesses.repository.js";
export class GetMemberBusinessesUseCase {
  constructor(private readonly repository: MemberBusinessesRepository) {}
  execute(userId: string): Promise<MemberBusiness[] | null> { return this.repository.findForUser(userId); }
}
