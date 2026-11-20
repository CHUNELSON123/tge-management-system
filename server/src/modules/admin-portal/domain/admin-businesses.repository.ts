export type BusinessReviewDecision = "approved" | "rejected" | "suspended";
export interface AdminBusinessFilter { search?: string; status?: string; categoryId?: string; page: number; pageSize: number }
export interface AdminBusinessReviewInput { status: BusinessReviewDecision; reason: string | null }
export interface AdminBusinessWriteInput { memberId: string; name: string; description: string | null; categoryIds: string[]; address: string | null; websiteUrl: string | null; email: string | null; phone: string | null }
export type AdminBusinessUpdateInput = Omit<AdminBusinessWriteInput, "memberId">;
export interface AdminBusinessRepository {
  list(filter: AdminBusinessFilter): Promise<unknown>;
  get(id: string): Promise<unknown | null>;
  review(id: string, actorId: string, input: AdminBusinessReviewInput): Promise<unknown | null>;
  categories(): Promise<Array<{ id: string; name: string }>>;
  owners(): Promise<Array<{ id: string; name: string; email: string }>>;
  create(actorId: string, input: AdminBusinessWriteInput): Promise<unknown>;
  update(id: string, actorId: string, input: AdminBusinessUpdateInput): Promise<unknown | null>;
}
