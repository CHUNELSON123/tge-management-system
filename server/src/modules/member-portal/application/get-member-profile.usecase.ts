import type { MemberProfileRepository, MemberProfileUpdate } from "../domain/member-profile.repository.js";

export class GetMemberProfileUseCase {
  constructor(private readonly repository: MemberProfileRepository) {}

  execute(userId: string) {
    return this.repository.findByUserId(userId);
  }

  update(userId: string, input: MemberProfileUpdate) {
    return this.repository.updateByUserId(userId, input);
  }
}
