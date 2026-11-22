export interface MemberBusiness {
  id: string; name: string; slug: string; description: string | null; status: string;
  publicationStatus: string; categories: string[]; categoryAssignments: Array<{ id: string; name: string }>;
  reviewReason: string | null;
  address: string | null; websiteUrl: string | null; email: string | null; phone: string | null;
}
export interface MemberBusinessInput { name: string; description: string | null; categoryIds: string[]; address: string | null; websiteUrl: string | null; email: string | null; phone: string | null }
export interface MemberBusinessesRepository {
  findForUser(userId: string): Promise<MemberBusiness[] | null>;
  categories(): Promise<Array<{ id: string; name: string }>>;
  saveForUser(userId: string, input: MemberBusinessInput, id?: string): Promise<MemberBusiness | null>;
}
