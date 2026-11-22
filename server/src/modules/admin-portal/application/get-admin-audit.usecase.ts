import type { AdminAuditFilter, AdminAuditRepository } from "../domain/admin-audit.repository.js";
export class GetAdminAuditUseCase {
  constructor(private readonly repository: AdminAuditRepository) {}
  list(filter: AdminAuditFilter) { return this.repository.list(filter); }
  actors() { return this.repository.actors(); }
}
