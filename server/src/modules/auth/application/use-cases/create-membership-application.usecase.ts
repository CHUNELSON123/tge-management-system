import type { MembershipApplicationRepository } from "../../domain/repositories/membership-application.repository.js";
import type { MembershipApplication } from "../../domain/entities/membership-application.entity.js";

export interface CreateMembershipApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

export class CreateMembershipApplicationUseCase {
  constructor(
    private readonly repository: MembershipApplicationRepository,
  ) {}

  async execute(
    input: CreateMembershipApplicationInput,
  ): Promise<MembershipApplication> {
    return this.repository.create({
      applicantFirstName: input.firstName,
      applicantLastName: input.lastName,
      applicantEmail: input.email,
      applicantPhone: input.phone ?? null,
    });
  }
}
