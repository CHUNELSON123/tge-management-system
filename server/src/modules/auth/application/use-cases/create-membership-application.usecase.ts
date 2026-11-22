import type { MembershipApplicationRepository } from "../../domain/repositories/membership-application.repository.js";
import type { MembershipApplication } from "../../domain/entities/membership-application.entity.js";

export interface CreateMembershipApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  location?: string | null; dateOfBirth?: string | null; gender?: string | null; nationality?: string | null; preferredLanguage?: string | null; timezone?: string | null; bio?: string | null;
}

export class CreateMembershipApplicationUseCase {
  constructor(
    private readonly repository: MembershipApplicationRepository,
    private readonly registrationEnabled: () => Promise<boolean> = async () => true,
  ) {}

  async execute(
    input: CreateMembershipApplicationInput,
  ): Promise<MembershipApplication> {
    if (!(await this.registrationEnabled())) throw new Error("PUBLIC_REGISTRATION_DISABLED");
    return this.repository.create({
      applicantFirstName: input.firstName,
      applicantLastName: input.lastName,
      applicantEmail: input.email,
      applicantPhone: input.phone ?? null,
      applicantLocation: input.location ?? null, applicantDateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00.000Z`) : null, applicantGender: input.gender ?? null, applicantNationality: input.nationality ?? null, applicantPreferredLanguage: input.preferredLanguage ?? null, applicantTimezone: input.timezone ?? null, applicantBio: input.bio ?? null,
    });
  }
}
