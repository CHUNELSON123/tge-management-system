export interface PublicPreviewItem {
  title: string;
  href: string;
  summary?: string | null;
  date?: string | null;
  category?: string | null;
}

export interface HomePreviews {
  programmes: PublicPreviewItem[];
  events: PublicPreviewItem[];
  businesses: PublicPreviewItem[];
  news: PublicPreviewItem[];
}

export interface PublicHomePreviewRepository {
  listProgrammes(limit: number): Promise<PublicPreviewItem[]>;
  listUpcomingEvents(limit: number, now: Date): Promise<PublicPreviewItem[]>;
  listApprovedBusinesses(limit: number): Promise<PublicPreviewItem[]>;
  listPublishedNews(limit: number, now: Date): Promise<PublicPreviewItem[]>;
}

export class GetHomePreviewsUseCase {
  constructor(private readonly repository: PublicHomePreviewRepository) {}

  async execute(now = new Date()): Promise<HomePreviews> {
    const limit = 3;
    const [programmes, events, businesses, news] = await Promise.all([
      this.repository.listProgrammes(limit),
      this.repository.listUpcomingEvents(limit, now),
      this.repository.listApprovedBusinesses(limit),
      this.repository.listPublishedNews(limit, now),
    ]);

    return { programmes, events, businesses, news };
  }
}
