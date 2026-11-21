export type PublicEntryKind = "blog" | "testimonial" | "faq";
export interface PublicWebsiteEntry { slug: string; title: string; summary: string | null; content: string; publishedAt: string }
export interface PublicWebsiteEntriesRepository {
  list(kind: PublicEntryKind, now: Date): Promise<PublicWebsiteEntry[]>;
  get(kind: PublicEntryKind, slug: string, now: Date): Promise<PublicWebsiteEntry | null>;
  media(id: string, now: Date): Promise<{ contentType: string; data: Uint8Array } | null>;
}
export class GetPublicWebsiteEntriesUseCase {
  constructor(private readonly repository: PublicWebsiteEntriesRepository) {}
  list(kind: PublicEntryKind) { return this.repository.list(kind, new Date()); }
  get(kind: PublicEntryKind, slug: string) { return this.repository.get(kind, slug, new Date()); }
  media(id: string) { return this.repository.media(id, new Date()); }
}
