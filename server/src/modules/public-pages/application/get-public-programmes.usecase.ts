export interface PublicProgrammeRecord {
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl?: string | null;
  startDate: string | null;
  endDate: string | null;
  programmeType?: string | null; targetAudience?: string | null; durationWeeks?: number | null; deliveryMode?: string | null; learningObjectives?: string[]; programContent?: string[]; eligibility?: string | null;
}

export interface PublicProgrammeRepository {
  listPublishedProgrammes(): Promise<PublicProgrammeRecord[]>;
}

export class GetPublicProgrammesUseCase {
  constructor(private readonly repository: PublicProgrammeRepository) {}

  execute(): Promise<PublicProgrammeRecord[]> {
    return this.repository.listPublishedProgrammes();
  }
}
