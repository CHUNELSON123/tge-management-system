import type { AdminBusinessFilter, AdminBusinessRepository, AdminBusinessReviewInput, AdminBusinessUpdateInput, AdminBusinessWriteInput } from "../domain/admin-businesses.repository.js";
export class ManageAdminBusinessesUseCase {
  constructor(private readonly repository: AdminBusinessRepository) {}
  list(filter: AdminBusinessFilter) { return this.repository.list(filter); }
  get(id: string) { return this.repository.get(id); }
  review(id: string, actorId: string, input: AdminBusinessReviewInput) { return this.repository.review(id, actorId, input); }
  categories() { return this.repository.categories(); }
  owners() { return this.repository.owners(); }
  create(actorId: string, input: AdminBusinessWriteInput) { return this.repository.create(actorId, input); }
  update(id: string, actorId: string, input: AdminBusinessUpdateInput) { return this.repository.update(id, actorId, input); }
}
