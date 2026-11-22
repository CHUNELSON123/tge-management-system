import type { MemberBusiness, MemberBusinessesRepository, MemberBusinessInput } from "../domain/member-businesses.repository.js";
export class GetMemberBusinessesUseCase {
  constructor(private readonly repository: MemberBusinessesRepository) {}
  execute(userId: string): Promise<MemberBusiness[] | null> { return this.repository.findForUser(userId); }
  categories() { return this.repository.categories(); }
  save(userId: string, input: MemberBusinessInput, id?: string) { return this.repository.saveForUser(userId, input, id); }
}
