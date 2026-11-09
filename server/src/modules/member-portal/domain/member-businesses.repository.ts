export interface MemberBusiness {
  id: string; name: string; slug: string; description: string | null; status: string;
  publicationStatus: string; categories: string[];
}
export interface MemberBusinessesRepository {
  findForUser(userId: string): Promise<MemberBusiness[] | null>;
}
