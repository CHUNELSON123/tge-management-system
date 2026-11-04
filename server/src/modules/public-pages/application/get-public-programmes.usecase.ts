export interface PublicProgrammeRecord {
  name: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
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
