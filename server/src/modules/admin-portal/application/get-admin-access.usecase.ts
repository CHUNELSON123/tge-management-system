import type { AdminAccessRepository } from "../domain/admin-access.repository.js";

export const ADMIN_PORTAL_PERMISSIONS = [
  "users.manage", "roles.manage", "system.manage", "audit.view", "members.manage",
  "programmes.manage", "events.manage", "resources.manage", "mentorship.manage", "businesses.manage",
  "reports.view", "website.manage", "payments.manage",
] as const;

export class GetAdminAccessUseCase {
  constructor(private readonly repository: AdminAccessRepository) {}

  async execute(roleId: string): Promise<string[]> {
    const grants = await this.repository.getPermissions(roleId);
    return ADMIN_PORTAL_PERMISSIONS.filter((permission) => grants.includes(permission));
  }
}
