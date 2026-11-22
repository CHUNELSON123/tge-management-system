import type { AdminUserFilter, AdminUsersRepository } from "../domain/admin-users.repository.js";
export class ManageAdminUsersUseCase {
  constructor(private readonly repository: AdminUsersRepository) {}
  list(filter: AdminUserFilter) { return this.repository.list(filter); }
  get(id: string) { return this.repository.get(id); }
  getPhoto(id: string) { return this.repository.getPhoto(id); }
  transition(id: string, status: "ACTIVE" | "SUSPENDED", actorId: string) { return this.repository.transition(id, status, actorId); }
  roles() { return this.repository.roles(); }
  assignableRoles(actorRole: string) { return this.repository.assignableRoles(actorRole); }
  filterRoles() { return this.repository.filterRoles(); }
  permissionCatalog() { return this.repository.permissionCatalog(); }
  assignRole(id: string, roleId: string, actorId: string) { return this.repository.assignRole(id, roleId, actorId); }
  updateRolePermissions(roleId: string, permissionIds: string[], actorId: string) { return this.repository.updateRolePermissions(roleId, permissionIds, actorId); }
}
