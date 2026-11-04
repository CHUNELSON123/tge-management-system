export interface PublicBusinessCategory {
  id: string;
  name: string;
}

export interface PublicBusinessSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  categories: PublicBusinessCategory[];
}

export interface PublicBusinessDetails extends PublicBusinessSummary {
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
}

export interface PublicBusinessQuery {
  q?: string;
  categoryId?: string;
  page: number;
  pageSize: number;
}

export interface PublicBusinessPage {
  items: PublicBusinessSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PublicBusinessRepository {
  listApprovedBusinesses(query: PublicBusinessQuery): Promise<PublicBusinessPage>;
  listPublicCategories(): Promise<(PublicBusinessCategory & { count: number })[]>;
  findApprovedBusinessBySlug(slug: string): Promise<PublicBusinessDetails | null>;
}

export class GetPublicBusinessesUseCase {
  constructor(private readonly repository: PublicBusinessRepository) {}
  execute(query: PublicBusinessQuery) { return this.repository.listApprovedBusinesses(query); }
}

export class GetPublicBusinessCategoriesUseCase {
  constructor(private readonly repository: PublicBusinessRepository) {}
  execute() { return this.repository.listPublicCategories(); }
}

export class GetPublicBusinessDetailsUseCase {
  constructor(private readonly repository: PublicBusinessRepository) {}
  execute(slug: string) { return this.repository.findApprovedBusinessBySlug(slug); }
}
