import type { MemberMentorshipData, MemberMentorshipRepository } from "../domain/member-mentorship.repository.js";
export class GetMemberMentorshipUseCase {
  constructor(private readonly repository: MemberMentorshipRepository) {}
  execute(userId: string): Promise<MemberMentorshipData | null> { return this.repository.findForUser(userId); }
}
