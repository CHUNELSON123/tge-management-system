import type { MemberProgrammeRecord, MemberProgrammesRepository } from "../domain/member-programmes.repository.js";

export class GetMemberProgrammesUseCase {
  constructor(private readonly repository: MemberProgrammesRepository) {}

  execute(userId: string): Promise<MemberProgrammeRecord[] | null> {
    return this.repository.listForMember(userId);
  }
}
