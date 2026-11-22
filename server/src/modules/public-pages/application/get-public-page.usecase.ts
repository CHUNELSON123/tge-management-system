export interface PublicPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  publishedAt: string;
}
export interface PublicPageRepository { findPublishedPageBySlug(slug: string, now: Date): Promise<PublicPage | null> }
export class GetPublicPageUseCase {
  constructor(private readonly repository: PublicPageRepository) {}
  execute(slug: string, now = new Date()) { return this.repository.findPublishedPageBySlug(slug, now); }
}
