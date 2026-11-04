export interface PublicNewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string;
  publishedAt: string;
}

export interface PublicNewsRepository {
  listPublishedNews(now: Date): Promise<PublicNewsArticle[]>;
  findPublishedNewsBySlug(slug: string, now: Date): Promise<PublicNewsArticle | null>;
}

export class GetPublicNewsUseCase {
  constructor(private readonly repository: PublicNewsRepository) {}
  execute(now = new Date()) { return this.repository.listPublishedNews(now); }
}

export class GetPublicNewsDetailsUseCase {
  constructor(private readonly repository: PublicNewsRepository) {}
  execute(slug: string, now = new Date()) { return this.repository.findPublishedNewsBySlug(slug, now); }
}
